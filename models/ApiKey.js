// models/ApiKey.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Acme Corp Integration"
    key: { type: String, unique: true }, // mv_live_xxxxxxxxxxxx
    company: { type: String, required: true },
    email: { type: String, required: true },
    permissions: {
      type: [String],
      default: ["products:read", "orders:read", "categories:read"],
      enum: [
        "products:read",
        "orders:read",
        "orders:write",
        "categories:read",
        "vendors:read",
        "users:read",
        "reviews:read",
        "webhooks:manage",
      ],
    },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date, default: null },
    requestCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Auto-generate key before saving
apiKeySchema.pre("save", function (next) {
  if (!this.key) {
    const raw = crypto.randomBytes(32).toString("hex");
    this.key = `mv_live_${raw}`;
  }
  next();
});

module.exports = mongoose.model("ApiKey", apiKeySchema);
