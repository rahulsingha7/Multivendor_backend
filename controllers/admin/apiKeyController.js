// controllers/admin/apiKeyController.js
const ApiKey = require("../../models/ApiKey");
const Webhook = require("../../models/Webhook");
const crypto = require("crypto");

// Get all API keys
exports.getAllApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find().sort({ createdAt: -1 }).select("-key"); // Never return full key in list
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch API keys" });
  }
};

// Create new API key
exports.createApiKey = async (req, res) => {
  try {
    const { name, company, email, permissions } = req.body;
    if (!name || !company || !email) {
      return res
        .status(400)
        .json({ message: "Name, company and email are required" });
    }

    const apiKey = await ApiKey.create({
      name,
      company,
      email,
      permissions: permissions || [
        "products:read",
        "orders:read",
        "categories:read",
      ],
      createdBy: req.user.userId,
    });

    // Return full key ONCE on creation — never shown again
    res.status(201).json({
      message: "API key created",
      apiKey: {
        _id: apiKey._id,
        name: apiKey.name,
        company: apiKey.company,
        email: apiKey.email,
        key: apiKey.key, // Full key shown only here
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
      },
      warning: "Save this key now — it will never be shown again in full.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create API key" });
  }
};

// Toggle active/inactive
exports.toggleApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) return res.status(404).json({ message: "API key not found" });
    apiKey.isActive = !apiKey.isActive;
    await apiKey.save();
    res.json({
      message: `API key ${apiKey.isActive ? "activated" : "deactivated"}`,
      isActive: apiKey.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle API key" });
  }
};

// Delete API key
exports.deleteApiKey = async (req, res) => {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    await Webhook.deleteMany({ apiKey: req.params.id });
    res.json({ message: "API key and associated webhooks deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete API key" });
  }
};

// Get webhooks for an API key
exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find({ apiKey: req.params.id });
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
};

// Create webhook for an API key
exports.createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !events?.length) {
      return res.status(400).json({ message: "URL and events are required" });
    }

    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) return res.status(404).json({ message: "API key not found" });

    const secret = crypto.randomBytes(16).toString("hex");

    const webhook = await Webhook.create({
      apiKey: req.params.id,
      url,
      events,
      secret,
    });

    res.status(201).json({
      message: "Webhook created",
      webhook,
      secret,
      tip: "Use this secret to verify incoming webhook signatures using HMAC-SHA256",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create webhook" });
  }
};

// Delete webhook
exports.deleteWebhook = async (req, res) => {
  try {
    await Webhook.findByIdAndDelete(req.params.webhookId);
    res.json({ message: "Webhook deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete webhook" });
  }
};

// Toggle webhook
exports.toggleWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.webhookId);
    if (!webhook) return res.status(404).json({ message: "Webhook not found" });
    webhook.isActive = !webhook.isActive;
    webhook.failureCount = 0;
    await webhook.save();
    res.json({
      message: `Webhook ${webhook.isActive ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle webhook" });
  }
};
