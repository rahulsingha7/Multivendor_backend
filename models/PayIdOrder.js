const mongoose = require("mongoose");

const payIdOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        price: Number,
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
    ],
    phone: { type: String, required: true },
    address: { type: String, required: true },
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["awaiting_payment", "paid", "expired", "cancelled"],
      default: "awaiting_payment",
    },
    zeptoContactId: { type: String, default: null },
    zeptoPaymentRequestId: { type: String, default: null },
    payIdEmail: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PayIdOrder", payIdOrderSchema);
