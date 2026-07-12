// routes/admin/apiKeyRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getAllApiKeys,
  createApiKey,
  toggleApiKey,
  deleteApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  toggleWebhook,
} = require("../../controllers/admin/apiKeyController");
const { validateApiKey } = require("../../middleware/validationMiddleware");

router.use(verifyToken, permitRoles("admin"));

// API Keys
router.get("/", getAllApiKeys);
router.post("/", validateApiKey, createApiKey);
router.patch("/:id/toggle", toggleApiKey);
router.delete("/:id", deleteApiKey);

// Webhooks (per API key)
router.get("/:id/webhooks", getWebhooks);
router.post("/:id/webhooks", createWebhook);
router.delete("/:id/webhooks/:webhookId", deleteWebhook);
router.patch("/:id/webhooks/:webhookId/toggle", toggleWebhook);

module.exports = router;
