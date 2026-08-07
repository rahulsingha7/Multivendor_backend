// routes/customer/zeptoWebhookRoutes.js
const express = require("express");
const router = express.Router();
const {
  handleZeptoWebhook,
} = require("../../controllers/customer/payIdController");

router.post("/", handleZeptoWebhook);

module.exports = router;
