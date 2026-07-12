//routes//customer//paymentRoutes.js
const express = require("express");
const router = express.Router();
const {
  createCheckoutSession,
} = require("../../controllers/customer/paymentController");
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");

router.use(verifyToken, permitRoles("customer"));
router.post("/create-checkout-session", createCheckoutSession);

module.exports = router;
