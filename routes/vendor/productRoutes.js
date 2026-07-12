// routes/vendor/productRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const upload = require("../../utils/cloudinaryUpload");
const {
  createProduct,
  getVendorProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../../controllers/vendor/productController");

// Apply auth & role middleware to all product routes
router.use(verifyToken, permitRoles("vendor"));

//  Create product with image upload
router.post("/", upload.single("image"), createProduct);

//  Read products
router.get("/", getVendorProducts);
router.get("/:id", getProduct);

// Update and Delete
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
