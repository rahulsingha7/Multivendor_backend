const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  createVendorPayout,
} = require("../../controllers/vendor/payoutController");

router.use(verifyToken, permitRoles("vendor"));

router.post("/", createVendorPayout);

module.exports = router;
