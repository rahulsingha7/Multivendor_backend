// models/Webhook.js
const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true,
    },
    url: { type: String, required: true }, // their endpoint URL
    events: {
      type: [String],
      default: ["order.created"],
      enum: [
        "order.created",
        "order.shipped",
        "order.delivered",
        "order.cancelled",
        "product.approved",
        "product.created",
        "vendor.approved",
        "user.registered",
        "payment.success",
      ],
    },
    secret: { type: String }, // HMAC secret for verifying webhook calls
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date, default: null },
    failureCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Webhook", webhookSchema);
