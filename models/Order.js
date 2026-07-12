//models//order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["paid", "shipped", "delivered", "cancelled"],
          default: "paid",
        },
      },
    ],
    totalAmount: Number,
    paymentIntentId: String,
    phone: { type: String, required: true },
    address: { type: String, required: true },
    confirmationEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
