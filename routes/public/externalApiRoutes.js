// routes/public/externalApiRoutes.js
const express = require("express");
const router = express.Router();
const apiKeyAuth = require("../../middleware/apiKeyMiddleware");
const {
  getProducts,
  getProduct,
  getCategories,
  getOrders,
  getReviews,
  getStats,
} = require("../../controllers/public/externalApiController");

// Public (still needs API key, but no specific permission)
router.get("/stats", apiKeyAuth(), getStats);
router.get("/categories", apiKeyAuth("categories:read"), getCategories);
router.get("/products", apiKeyAuth("products:read"), getProducts);
router.get("/products/:id", apiKeyAuth("products:read"), getProduct);
router.get("/reviews", apiKeyAuth("reviews:read"), getReviews);
router.get("/orders", apiKeyAuth("orders:read"), getOrders);

module.exports = router;
