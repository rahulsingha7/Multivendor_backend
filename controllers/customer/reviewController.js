//controllers//customer//reviewController.js
const mongoose = require("mongoose");
const Review = require("../../models/Review");
const Order = require("../../models/Order");

exports.createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  const userId = req.user.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const hasOrdered = await Order.exists({
      customer: userId,
      "products.product": productObjectId,
    });

    if (!hasOrdered) {
      return res.status(403).json({
        message: "You must purchase before reviewing.",
      });
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productObjectId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You already reviewed this product." });
    }

    const newReview = new Review({
      product: productObjectId,
      user: userId,
      rating,
      comment,
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.userId; 

  try {
    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.rating = rating;
    review.comment = comment;

    await review.save();
    res.json(review);
  } catch (error) {
    console.error("Error in updateReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.userId; 

  try {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCustomerReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId; 

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const review = await Review.findOne({
      product: productObjectId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "No review found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error in getCustomerReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};
