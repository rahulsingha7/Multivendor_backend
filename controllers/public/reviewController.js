// controllers/public/reviewController.js

const Review = require("../../models/Review");

exports.getPublicReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const page = parseInt(req.query.page) || 1;

    const totalCount = await Review.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product", "name")
      .populate("user", "name");

    res.json({ reviews, totalPages });
  } catch (err) {
    console.error("Error fetching public reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
};
