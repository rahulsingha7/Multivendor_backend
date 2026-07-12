// utils/webhookDispatcher.js
// Sends events to all registered webhook URLs for a given event type
const crypto = require("crypto");
const axios = require("axios");
const Webhook = require("../models/Webhook");

const dispatch = async (eventName, payload) => {
  try {
    const webhooks = await Webhook.find({
      events: eventName,
      isActive: true,
    }).populate("apiKey");

    if (!webhooks.length) return;

    const eventPayload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    for (const webhook of webhooks) {
      // Skip if API key is inactive
      if (!webhook.apiKey?.isActive) continue;

      try {
        // Generate HMAC signature so they can verify it's from us
        const signature = webhook.secret
          ? crypto
              .createHmac("sha256", webhook.secret)
              .update(JSON.stringify(eventPayload))
              .digest("hex")
          : null;

        const headers = {
          "Content-Type": "application/json",
          "X-MultiVendor-Event": eventName,
          "X-MultiVendor-Timestamp": eventPayload.timestamp,
          ...(signature && {
            "X-MultiVendor-Signature": `sha256=${signature}`,
          }),
        };

        await axios.post(webhook.url, eventPayload, {
          headers,
          timeout: 5000,
        });

        // Reset failure count on success
        await Webhook.findByIdAndUpdate(webhook._id, {
          lastTriggered: new Date(),
          failureCount: 0,
        });

        console.log(`✅ Webhook dispatched: ${eventName} → ${webhook.url}`);
      } catch (err) {
        console.error(
          `❌ Webhook failed: ${eventName} → ${webhook.url}:`,
          err.message,
        );

        // Increment failure count, deactivate after 10 failures
        const updated = await Webhook.findByIdAndUpdate(
          webhook._id,
          { $inc: { failureCount: 1 } },
          { new: true },
        );
        if (updated.failureCount >= 10) {
          await Webhook.findByIdAndUpdate(webhook._id, { isActive: false });
          console.warn(
            `⚠️ Webhook deactivated after 10 failures: ${webhook.url}`,
          );
        }
      }
    }
  } catch (err) {
    console.error("Webhook dispatcher error:", err.message);
  }
};

module.exports = { dispatch };
