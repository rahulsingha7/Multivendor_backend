const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  validateCoupon,
} = require("../../controllers/customer/couponController");

router.use(verifyToken, permitRoles("customer"));
router.post("/validate", validateCoupon);

module.exports = router;
