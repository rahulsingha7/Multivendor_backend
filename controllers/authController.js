//controller//authcontroller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const admin = require("../utils/firebaseAdmin");
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!PASSWORD_REGEX.test(password || "")) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include a letter and a number",
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome to MultiVendor Shop!</h2>
        <p>Hi ${name},</p>
        <p>Your email verification code is:</p>
        <h1 style="color: #4F46E5;">${code}</h1>
        <p>Please enter this code in the app to complete your registration.</p>
        <p>If you did not register, you can safely ignore this email.</p>
        <br/>
        <p>Thanks,<br/>MultiVendor Team</p>
      </div>
    `;

    await sendEmail(email, "Verify your email", emailHtml);

    const token = jwt.sign(
      { name, email, password: hashedPassword, role, code },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.status(200).json({ message: "Verification code sent", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { code } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.code !== code)
      return res.status(400).json({ message: "Invalid verification code" });

    const existing = await User.findOne({ email: decoded.email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const newUser = new User({
      name: decoded.name,
      email: decoded.email,
      password: decoded.password,
      role: decoded.role || "customer",
      isEmailVerified: true,
      isVendorApproved: decoded.role === "vendor" ? false : undefined,
    });

    await newUser.save();

    res.json({ message: "Email verified. Registration complete." });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

exports.login = async (req, res) => {
  const { email, password, expectedRole } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res
        .status(403)
        .json({ message: `Only ${expectedRole}s can login here.` });
    }

    if (user.role === "vendor" && user.isVendorApproved !== true) {
      return res
        .status(403)
        .json({ message: "Vendor account not approved yet." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { id_token, role } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(id_token);
    const { email, name, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      // New user, create with the role
      user = new User({
        name,
        email,
        password: null,
        role,
        isEmailVerified: true,
        isVendorApproved: role === "vendor" ? false : undefined,
      });
      await user.save();
    } else {
      // Existing user: check role match
      if (user.role !== role) {
        return res.status(403).json({
          message: `This account is registered as a ${user.role}. Please login through the appropriate portal.`,
        });
      }

      // ✅ Check vendor approval if role is vendor
      if (user.role === "vendor" && user.isVendorApproved !== true) {
        return res.status(403).json({
          message: "Vendor account not approved yet.",
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token });
  } catch (err) {
    console.error("Firebase token verification failed:", err);
    res.status(401).json({ message: "Invalid Firebase ID token" });
  }
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. It expires in 10 minutes:</p>
      <a href="${resetLink}" style="color: #4F46E5;">Reset Password</a>
      <p>If you didn’t request this, just ignore this email.</p>
    `;

    await sendEmail(email, "Reset Your Password", emailHtml);
    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token is invalid or expired" });

    if (!PASSWORD_REGEX.test(password || "")) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include a letter and a number",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email role createdAt",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name && name.trim()) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword)
        return res
          .status(400)
          .json({ message: "Current password is required" });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      if (!PASSWORD_REGEX.test(newPassword))
        return res.status(400).json({
          message:
            "Password must be at least 8 characters and include a letter and a number",
        });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: { name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: "Failed to update profile" });
  }
};
