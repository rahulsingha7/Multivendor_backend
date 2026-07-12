// routes/customer/webhookRoutes.js
const express = require("express");
const router = express.Router();
const {
  handleStripeWebhook,
} = require("../../controllers/customer/paymentWebhookController");

router.post("/", handleStripeWebhook);

module.exports = router;
