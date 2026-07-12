// routes/customer/productRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const upload = require("../../utils/cloudinaryUpload");
const {
  createProduct,
  getCustomerProducts,
  updateProduct,
  deleteProduct,
} = require("../../controllers/customer/productController");
const {
  getSellerDashboard,
  getMarketplaceExplorer,
} = require("../../controllers/customer/sellerDashboardController");

router.use(verifyToken, permitRoles("customer"));

// ⚠️ Static routes MUST come before /:id dynamic routes
router.get("/dashboard", getSellerDashboard);
router.get("/marketplace", getMarketplaceExplorer);

router.post("/", upload.single("image"), createProduct);
router.get("/", getCustomerProducts);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
