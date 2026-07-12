// controllers/customer/productController.js
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const cloudinary = require("cloudinary").v2;

// ✅ Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryName } = req.body;
    const image = req.file?.path;

    if (!name || !categoryName || isNaN(price) || isNaN(stock) || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (price < 0 || stock < 0) {
      return res.status(400).json({
        message: "Price and stock must be non-negative numbers.",
      });
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = await Category.create({ name: categoryName });
    }

    const existingProduct = await Product.findOne({
      name,
      vendor: req.user.userId,
    });
    if (existingProduct) {
      return res.status(400).json({
        message: "You already have a product with this name.",
      });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl: req.file.path,
      imageId: req.file.filename,
      vendor: req.user.userId,
      category: category._id,
      isApproved: false,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all customer products (search + pagination)
exports.getCustomerProducts = async (req, res) => {
  try {
    const { search = "", page = 1 } = req.query;
    const perPage = 10;
    const currentPage = parseInt(page) || 1;

    const query = {
      vendor: req.user.userId,
      name: { $regex: search, $options: "i" },
    };

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    const products = await Product.find(query)
      .populate("category", "name")
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({ products, totalPages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.user.userId,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, stock, categoryName } = req.body;
    const updatedPrice = price !== undefined ? Number(price) : product.price;
    const updatedStock = stock !== undefined ? Number(stock) : product.stock;

    if (isNaN(updatedPrice) || isNaN(updatedStock)) {
      return res
        .status(400)
        .json({ message: "Price and stock must be numbers." });
    }
    if (updatedPrice < 0 || updatedStock < 0) {
      return res
        .status(400)
        .json({ message: "Price and stock must be non-negative." });
    }

    if (name && name !== product.name) {
      const duplicate = await Product.findOne({
        name,
        vendor: req.user.userId,
        _id: { $ne: product._id },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ message: "You already have a product with this name." });
      }
      product.name = name;
    }

    product.description = description || product.description;
    product.price = updatedPrice;
    product.stock = updatedStock;

    if (req.file) {
      if (product.imageId) await cloudinary.uploader.destroy(product.imageId);
      product.imageUrl = req.file.path;
      product.imageId = req.file.filename;
    }

    if (categoryName) {
      const category = await Category.findOneAndUpdate(
        { name: categoryName },
        { name: categoryName },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      product.category = category._id;
    }

    product.isApproved = false;
    await product.save();

    const updatedProduct = await Product.findById(product._id).populate(
      "category",
      "name",
    );
    res.json({ message: "Product updated", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user.userId,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.imageId) {
      await cloudinary.uploader.destroy(product.imageId);
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
