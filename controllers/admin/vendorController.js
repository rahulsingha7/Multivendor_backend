const User = require("../../models/User");

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve a vendor
exports.approveVendor = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const vendor = await User.findByIdAndUpdate(
      vendorId,
      { isVendorApproved: true },
      { new: true }
    ).select("-password");

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: "Vendor approved", vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject (or delete) a vendor
exports.deleteVendor = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const deleted = await User.findByIdAndDelete(vendorId);
    if (!deleted) return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
