//models//user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    isVendorApproved: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    socialId: { type: String }, // for OAuth users
  },

  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
