const Coupon = require("../../models/Coupon");

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code)
      return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon)
      return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive)
      return res
        .status(400)
        .json({ message: "This coupon is no longer active" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: "This coupon has expired" });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
      return res
        .status(400)
        .json({ message: "This coupon has reached its usage limit" });
    if (orderAmount < coupon.minOrderAmount)
      return res
        .status(400)
        .json({
          message: `Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`,
        });

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, orderAmount);
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    });
  } catch {
    res.status(500).json({ message: "Failed to validate coupon" });
  }
};
