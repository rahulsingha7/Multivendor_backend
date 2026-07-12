//routes//customer//reviewroutes.js
const express = require("express");
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getCustomerReview,
} = require("../../controllers/customer/reviewController");

const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");

// Apply middleware stack: only customers allowed
router.use(verifyToken, permitRoles("customer"));

// Review Routes
router.post("/:productId", createReview); // Add Review
router.put("/:reviewId", updateReview); // Edit Review
router.delete("/:reviewId", deleteReview); // Delete Review
router.get("/:productId", getCustomerReview); // Get Review by Current User

module.exports = router;
