//controllers//admin//productController.js
const Product = require("../../models/Product");

exports.getAllProducts = async (req, res) => {
  try {
    const { search = "", page = 1 } = req.query;
    const perPage = 10;
    const currentPage = parseInt(page) || 1;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    const products = await Product.find(query)
      .populate("vendor", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.json({ products, totalPages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      productId,
      { isApproved: true },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product approved", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to approve product", error: err.message });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      productId,
      { isApproved: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product rejected", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reject product", error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: err.message });
  }
};
