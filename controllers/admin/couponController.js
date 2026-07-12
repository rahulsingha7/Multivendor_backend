const Coupon = require("../../models/Coupon");

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      expiresAt,
    } = req.body;
    if (!code || !discountType || !discountValue) {
      return res
        .status(400)
        .json({ message: "Code, type and value are required" });
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || null,
      expiresAt: expiresAt || null,
    });
    res.status(201).json({ message: "Coupon created", coupon });
  } catch (err) {
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch {
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`,
      coupon,
    });
  } catch {
    res.status(500).json({ message: "Failed to toggle coupon" });
  }
};

