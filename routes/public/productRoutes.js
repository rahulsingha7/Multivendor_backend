const express = require("express");
const router = express.Router();
const {
  getPublicProducts,
  getProductsByCategory,
  getProductById,
  getProductReviews,
} = require("../../controllers/public/productController");
const Product = require("../../models/Product");

router.get("/", getPublicProducts);
router.get("/grouped", getProductsByCategory);
router.get("/:id", async (req, res, next) => {
  // Increment view count silently then pass to controller
  Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(
    () => {},
  );
  return getProductById(req, res, next);
});
router.get("/:id/reviews", getProductReviews);

module.exports = router;
