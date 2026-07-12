// middleware/apiKeyMiddleware.js
const ApiKey = require("../models/ApiKey");

// Validates API key from header: Authorization: Bearer mv_live_xxx
// or X-API-Key: mv_live_xxx
const apiKeyAuth = (requiredPermission) => async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const xApiKey = req.headers["x-api-key"];

    let key = null;

    if (xApiKey) {
      key = xApiKey;
    } else if (authHeader && authHeader.startsWith("Bearer mv_live_")) {
      key = authHeader.split(" ")[1];
    }

    if (!key) {
      return res.status(401).json({
        error: "API key required",
        message:
          "Include your API key in the X-API-Key header or Authorization: Bearer mv_live_xxx",
      });
    }

    const apiKey = await ApiKey.findOne({ key, isActive: true });

    if (!apiKey) {
      return res.status(401).json({
        error: "Invalid API key",
        message: "This API key does not exist or has been deactivated",
      });
    }

    // Check permission
    if (
      requiredPermission &&
      !apiKey.permissions.includes(requiredPermission)
    ) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `This API key does not have the '${requiredPermission}' permission`,
        yourPermissions: apiKey.permissions,
      });
    }

    // Update usage stats
    ApiKey.findByIdAndUpdate(apiKey._id, {
      lastUsed: new Date(),
      $inc: { requestCount: 1 },
    }).catch(() => {});

    req.apiKey = apiKey;
    next();
  } catch (err) {
    res.status(500).json({ error: "API key validation failed" });
  }
};

module.exports = apiKeyAuth;
