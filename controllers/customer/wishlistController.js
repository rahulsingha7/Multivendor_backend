// controllers/customer/wishlistController.js
const Wishlist = require("../../models/Wishlist");

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      customer: req.user.userId,
    }).populate(
      "products",
      "name price imageUrl images stock category isApproved",
    );

    res.json({ products: wishlist?.products || [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// Toggle product in wishlist (add if not exists, remove if exists)
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ message: "Product ID required" });

    let wishlist = await Wishlist.findOne({ customer: req.user.userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        customer: req.user.userId,
        products: [productId],
      });
      return res.json({ added: true, message: "Added to wishlist" });
    }

    const exists = wishlist.products.some((p) => p.toString() === productId);

    if (exists) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId,
      );
      await wishlist.save();
      return res.json({ added: false, message: "Removed from wishlist" });
    } else {
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ added: true, message: "Added to wishlist" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { customer: req.user.userId },
      { products: [] },
    );
    res.json({ message: "Wishlist cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear wishlist" });
  }
};
