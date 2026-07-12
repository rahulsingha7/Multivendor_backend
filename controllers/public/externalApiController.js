// controllers/public/externalApiController.js
// These are the endpoints external companies call using their API key
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const Category = require("../../models/Category");
const Review = require("../../models/Review");
const User = require("../../models/User");

// GET /api/external/products
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      limit = 20,
      page = 1,
      sort = "newest",
      search = "",
    } = req.query;
    const query = { isApproved: true };
    if (category) {
      const cat = await Category.findOne({
        name: new RegExp(`^${category}$`, "i"),
      });
      if (cat) query.category = cat._id;
    }
    if (search) query.name = { $regex: search, $options: "i" };

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      most_viewed: { views: -1 },
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select(
        "name description price stock imageUrl images category views createdAt",
      );

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/external/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isApproved: true,
    })
      .populate("category", "name")
      .populate("vendor", "name")
      .select(
        "name description price stock imageUrl images category vendor views createdAt",
      );

    if (!product)
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });

    Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(
      () => {},
    );

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/external/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/external/orders (requires orders:read permission)
exports.getOrders = async (req, res) => {
  try {
    const { limit = 20, page = 1, status } = req.query;
    const query = {};
    if (status) query["products.status"] = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("customer", "name email")
      .populate("products.product", "name price")
      .select("customer products totalAmount address phone createdAt");

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/external/reviews
exports.getReviews = async (req, res) => {
  try {
    const { productId, limit = 20, page = 1 } = req.query;
    const query = productId ? { product: productId } : {};

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name")
      .populate("product", "name");

    res.json({ success: true, total, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/external/stats (public platform stats)
exports.getStats = async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalVendors, totalCustomers] =
      await Promise.all([
        Product.countDocuments({ isApproved: true }),
        Order.countDocuments(),
        User.countDocuments({ role: "vendor" }),
        User.countDocuments({ role: "customer" }),
      ]);

    const revenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalVendors,
        totalCustomers,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
