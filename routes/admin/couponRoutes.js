const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  toggleCoupon,
} = require("../../controllers/admin/couponController");

router.use(verifyToken, permitRoles("admin"));
router.get("/", getCoupons);
router.post("/", createCoupon);
router.delete("/:id", deleteCoupon);
router.put("/:id/toggle", toggleCoupon);

module.exports = router;
