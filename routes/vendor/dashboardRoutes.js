//routes//vendor//dashboardRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getVendorDashboardStats,
} = require("../../controllers/vendor/dashboardController");
router.use(verifyToken, permitRoles("vendor"));

router.get("/", getVendorDashboardStats);

module.exports = router;
