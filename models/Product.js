const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: String,
    imageId: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isApproved: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ name: 1, vendor: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
