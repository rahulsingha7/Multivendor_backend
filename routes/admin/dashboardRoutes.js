const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getDashboardStats,
  getMonthlyOrders,
  getVendorRevenue,
  getProductPerCategory,
} = require("../../controllers/admin/dashboardController");

router.use(verifyToken, permitRoles("admin"));

router.get("/stats", getDashboardStats);
router.get("/monthly-orders", getMonthlyOrders);
router.get("/vendor-revenue", getVendorRevenue);
router.get("/category-products", getProductPerCategory);

module.exports = router;
