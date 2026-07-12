const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getCustomerOrders,
  getCustomerStats,
  sendOrderConfirmation,
} = require("../../controllers/customer/orderController");

router.use(verifyToken, permitRoles("customer"));
router.get("/", getCustomerOrders);
router.get("/stats", getCustomerStats);
router.post("/confirm-email", sendOrderConfirmation);

module.exports = router;
