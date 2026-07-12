//controllers//customer//orderController.js
const Order = require("../../models/Order");
const sendEmail = require("../../utils/sendEmail");
const generateOrderConfirmationEmail = require("../../utils/orderConfirmationEmail");

exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const totalCount = await Order.countDocuments({ customer: customerId });
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("products.product", "name price imageUrl")
      .populate("products.vendor", "name");

    res.json({ orders, totalPages });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ error: "Server error while fetching orders" });
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const orders = await Order.find({ customer: customerId });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const delivered = orders.filter((o) =>
      o.products.every((p) => p.status === "delivered"),
    ).length;
    res.json({ totalOrders, totalSpent, delivered });
  } catch {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// ── Send order confirmation email after successful payment ──
exports.sendOrderConfirmation = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Fetch user email from DB since JWT doesn't contain it
    const User = require("../../models/User");
    const user = await User.findById(customerId).select("name email");

    if (!user?.email) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the most recent order for this customer
    const order = await Order.findOne({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate("products.product", "name price");

    if (!order) {
      return res.status(404).json({ message: "No recent order found" });
    }

    // Avoid resending if already sent
    if (order.confirmationEmailSent) {
      return res.json({ message: "Confirmation already sent" });
    }

    const orderNumber = `#${order._id.toString().slice(-6).toUpperCase()}`;

    const html = generateOrderConfirmationEmail({
      customerName: user.name || "Valued Customer",
      orderNumber,
      items: order.products.map((p) => ({
        name: p.product?.name || "Item",
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: order.totalAmount,
      address: order.address || "N/A",
      phone: order.phone || "N/A",
    });

    await sendEmail(
      user.email,
      `✅ Order Confirmed ${orderNumber} — MultiVendor Shop`,
      html,
    );

    order.confirmationEmailSent = true;
    await order.save();

    console.log(`📧 Order confirmation sent to ${user.email}`);
    res.json({ message: "Confirmation email sent" });
  } catch (err) {
    console.error("Failed to send order confirmation:", err.message);
    res.status(500).json({ message: "Failed to send confirmation email" });
  }
};
