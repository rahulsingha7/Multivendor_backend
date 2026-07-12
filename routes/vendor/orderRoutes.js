// routes/vendor/orderRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getVendorOrders,
  updateVendorProductStatus,
} = require("../../controllers/vendor/orderController");

router.use(verifyToken, permitRoles("vendor"));

router.get("/", getVendorOrders);
router.put("/update-status", updateVendorProductStatus);

module.exports = router;
