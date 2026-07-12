const Order = require("../../models/Order");
const User = require("../../models/User");
const mongoose = require("mongoose");
const sendEmail = require("../../utils/sendEmail");
const { dispatch } = require("../../utils/webhookDispatcher");
const {
  shippedEmail,
  deliveredEmail,
  cancelledEmail,
} = require("../../utils/orderStatusEmails");

exports.getVendorOrders = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.userId); // ← fix: cast to ObjectId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim().toLowerCase() || "";
    const sortBy = req.query.sortBy || "newest";

    let sortStage = {};
    if (sortBy === "newest") sortStage = { createdAt: -1 };
    else if (sortBy === "oldest") sortStage = { createdAt: 1 };
    else if (sortBy === "totalHigh") sortStage = { vendorTotal: -1 };
    else if (sortBy === "totalLow") sortStage = { vendorTotal: 1 };

    const pipeline = [
      {
        $match: {
          "products.vendor": vendorId, // ← now comparing ObjectId to ObjectId
        },
      },
      {
        $addFields: {
          vendorProducts: {
            $filter: {
              input: "$products",
              as: "p",
              cond: { $eq: ["$$p.vendor", vendorId] },
            },
          },
        },
      },
      {
        $addFields: {
          vendorTotal: {
            $sum: {
              $map: {
                input: "$vendorProducts",
                as: "item",
                in: { $multiply: ["$$item.price", "$$item.quantity"] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $lookup: {
          from: "products",
          localField: "vendorProducts.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $match: {
          ...(search && {
            $or: [
              { "customer.name": { $regex: search, $options: "i" } },
              { "customer.email": { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          }),
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result = await Order.aggregate(pipeline);
    const rawOrders = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    // Map vendorProducts back with populated product details
    const orders = rawOrders.map((order) => ({
      ...order,
      products: order.vendorProducts.map((vp) => {
        const productDetail = order.productDetails?.find(
          (pd) => pd._id.toString() === vp.product.toString(),
        );
        return {
          ...vp,
          product: productDetail || { _id: vp.product, name: "Unknown" },
        };
      }),
      totalAmount: order.vendorTotal,
    }));

    res.json({ orders, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error("Vendor Orders Error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

exports.updateVendorProductStatus = async (req, res) => {
  try {
    const { orderId, productId, status } = req.body;
    const vendorId = req.user.userId;

    if (!["shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const product = order.products.find(
      (p) =>
        p.product.toString() === productId && p.vendor.toString() === vendorId,
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or not owned by vendor" });
    }

    if (product.status !== "paid" && status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a product that's already processed" });
    }

    product.status = status;
    await order.save();

    // ── Send status email to customer ──
    try {
      const customer = await User.findById(order.customer).select("name email");
      if (customer?.email) {
        const orderNumber = `#${order._id.toString().slice(-6).toUpperCase()}`;
        const items = [
          { name: product.name || "Your item", quantity: product.quantity },
        ];

        let html, subject;
        if (status === "shipped") {
          html = shippedEmail({
            customerName: customer.name || "Customer",
            orderNumber,
            items,
          });
          subject = `🚚 Your order ${orderNumber} has shipped — MultiVendorShop`;
        } else if (status === "delivered") {
          html = deliveredEmail({
            customerName: customer.name || "Customer",
            orderNumber,
            items,
            productId,
          });
          subject = `✅ Your order ${orderNumber} has been delivered — MultiVendorShop`;
        } else if (status === "cancelled") {
          html = cancelledEmail({
            customerName: customer.name || "Customer",
            orderNumber,
            items,
          });
          subject = `❌ Item in order ${orderNumber} was cancelled — MultiVendorShop`;
        }

        if (html) {
          await sendEmail(customer.email, subject, html);
          console.log(`📧 ${status} email sent to ${customer.email}`);
        }

        // Fire webhook
        dispatch(`order.${status}`, {
          orderId: order._id,
          productId,
          status,
          customer: { name: customer.name, email: customer.email },
        }).catch(() => {});
      }
    } catch (emailErr) {
      // Don't fail the status update if email fails
      console.error("Status email failed (non-critical):", emailErr.message);
    }

    res.json({ message: "Product status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};
