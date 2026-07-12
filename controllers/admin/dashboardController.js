//controllers//admin//dashboardController.js
const User = require("../../models/User");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const Category = require("../../models/Category");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalVendors = await User.countDocuments({ role: "vendor" });

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    res.json({
      totalUsers,
      totalCustomers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

exports.getMonthlyOrders = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      orders: 0,
    }));

    result.forEach((r) => {
      data[r._id - 1].orders = r.total;
    });

    res.json(data);
  } catch (err) {
    console.error("Monthly order error:", err);
    res.status(500).json({ message: "Failed to load monthly orders" });
  }
};

exports.getVendorRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.vendor",
          revenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      {
        $project: {
          _id: 0,
          name: { $arrayElemAt: ["$vendor.name", 0] },
          revenue: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Vendor revenue error:", err);
    res.status(500).json({ message: "Failed to load vendor revenue" });
  }
};

exports.getProductPerCategory = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          _id: 0,
          name: { $arrayElemAt: ["$category.name", 0] },
          count: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Category product error:", err);
    res.status(500).json({ message: "Failed to load category stats" });
  }
};
