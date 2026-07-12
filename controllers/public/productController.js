// controllers/public/productController.js
const Product = require("../../models/Product");
const Category = require("../../models/Category");

exports.getPublicProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("category", "name")
      .populate("vendor", "_id");

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching public products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const {
      category: categoryFilter = "",
      search = "",
      page = 1,
      limit = 8,
      sort = "newest",
    } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let category = null;
    if (categoryFilter) {
      category = await Category.findOne({
        name: categoryFilter.toLowerCase().trim(),
      });
      if (!category) {
        return res.status(200).json({
          groupedProducts: { [categoryFilter]: [] },
          totalPages: 0,
          currentPage: pageNum,
        });
      }
    }

    const query = {
      isApproved: true,
      ...(category ? { category: category._id } : {}),
      name: { $regex: search, $options: "i" },
    };

    const sortOption =
      sort === "price_asc"
        ? { price: 1 }
        : sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("vendor", "_id")
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const grouped = {};
    products.forEach((product) => {
      const catName = product.category?.name || "Uncategorized";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(product);
    });

    const finalGrouped = categoryFilter
      ? { [categoryFilter]: grouped[categoryFilter] || [] }
      : grouped;

    res.status(200).json({
      groupedProducts: finalGrouped,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Error grouping products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isApproved: true,
    })
      .populate("category", "name")
      .populate("vendor", "name _id");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const Review = require("../../models/Review");
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res
      .status(200)
      .json({
        reviews,
        avgRating: parseFloat(avgRating.toFixed(1)),
        total: reviews.length,
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};
