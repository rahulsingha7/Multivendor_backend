// routes/customer/payIdRoutes.js
const express = require("express");
const router = express.Router();

const {
  createPayIdOrder,
  getPayIdOrderStatus,
} = require("../../controllers/customer/payIdController");

router.post("/create", createPayIdOrder);
router.get("/:orderId/status", getPayIdOrderStatus);

module.exports = router;
