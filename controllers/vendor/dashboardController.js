const Product = require("../../models/Product");
const Order = require("../../models/Order");

exports.getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const totalProducts = await Product.countDocuments({ vendor: vendorId });

    // Date helpers
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Fetch all orders that include vendor's products
    const allOrders = await Order.find({ "products.vendor": vendorId })
      .sort({ createdAt: -1 })
      .populate("products.product", "name");

    let totalOrders = 0;
    let totalEarnings = 0;
    let currentMonthEarnings = 0;
    let lastMonthEarnings = 0;
    let currentMonthOrders = 0;
    let lastMonthOrders = 0;
    const productSales = {};

    allOrders.forEach((order) => {
      const vendorProducts = order.products.filter(
        (p) =>
          p.vendor.toString() === vendorId &&
          ["paid", "shipped", "delivered"].includes(p.status),
      );

      if (vendorProducts.length === 0) return;

      totalOrders++;
      const orderEarnings = vendorProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0,
      );
      totalEarnings += orderEarnings;

      const orderDate = new Date(order.createdAt);
      if (orderDate >= startOfThisMonth) {
        currentMonthEarnings += orderEarnings;
        currentMonthOrders++;
      } else if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
        lastMonthEarnings += orderEarnings;
        lastMonthOrders++;
      }

      vendorProducts.forEach((item) => {
        const pid = item.product._id.toString();
        if (!productSales[pid]) {
          productSales[pid] = {
            name: item.product.name,
            quantity: 0,
            earnings: 0,
          };
        }
        productSales[pid].quantity += item.quantity;
        productSales[pid].earnings += item.price * item.quantity;
      });
    });

    // Best-selling product
    let bestSellingProduct = null;
    let maxQuantity = 0;
    Object.values(productSales).forEach((prod) => {
      if (prod.quantity > maxQuantity) {
        maxQuantity = prod.quantity;
        bestSellingProduct = prod;
      }
    });

    // Recent orders (last 5)
    const recentOrders = allOrders.slice(0, 5).map((order) => ({
      _id: order._id,
      createdAt: order.createdAt,
      products: order.products
        .filter((p) => p.vendor.toString() === vendorId)
        .map((p) => ({
          name: p.product.name,
          quantity: p.quantity,
          price: p.price,
          status: p.status,
        })),
      totalAmount: order.products
        .filter((p) => p.vendor.toString() === vendorId)
        .reduce((sum, p) => sum + p.price * p.quantity, 0),
    }));

    res.json({
      totalProducts,
      totalOrders,
      totalEarnings,
      currentMonthEarnings,
      lastMonthEarnings,
      currentMonthOrders,
      lastMonthOrders,
      recentOrders,
      bestSellingProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
