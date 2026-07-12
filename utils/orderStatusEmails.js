// utils/orderStatusEmails.js
// Branded email templates for order status updates

const BRAND = {
  primary: "#f97316",
  ink: "#1a1a1a",
  muted: "#6b7280",
  border: "#e5e7eb",
  support: process.env.EMAIL_USER || "support@multivendor.shop",
  url: process.env.CLIENT_URL || "http://localhost:5173",
};

const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background-color:${BRAND.ink};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">
        <span style="color:${BRAND.primary};">Multi</span>Vendor
      </h1>
      <p style="margin:5px 0 0;color:rgba(255,255,255,0.45);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Your Trusted Marketplace</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};padding:36px 32px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background-color:${BRAND.ink};border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;">
        © ${new Date().getFullYear()} MultiVendorShop &nbsp;·&nbsp;
        <a href="mailto:${BRAND.support}" style="color:${BRAND.primary};text-decoration:none;">Contact Support</a>
      </p>
    </div>

  </div>
</body>
</html>`;

const ctaButton = (text, url) => `
  <div style="text-align:center;margin-top:28px;">
    <a href="${url}"
      style="display:inline-block;background:${BRAND.primary};color:#ffffff;font-weight:700;font-size:14px;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;">
      ${text}
    </a>
  </div>`;

const orderNumberBadge = (orderNumber) => `
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 20px;margin:20px 0;display:flex;align-items:center;justify-content:space-between;">
    <span style="color:${BRAND.muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order Number</span>
    <span style="color:${BRAND.primary};font-weight:900;font-size:16px;">${orderNumber}</span>
  </div>`;

const itemsTable = (items) => `
  <table style="width:100%;border-collapse:collapse;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;margin:16px 0 0;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.05em;">Item</th>
        <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.ink};font-size:14px;font-weight:600;">${item.name}</td>
          <td style="padding:12px 16px;border-top:1px solid ${BRAND.border};text-align:right;color:${BRAND.muted};font-size:14px;">×${item.quantity}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;

// ── Shipped email ──────────────────────────────────────────────────────────
const shippedEmail = ({ customerName, orderNumber, items }) =>
  baseWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#e0f2fe;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:12px;">🚚</div>
      <h2 style="margin:0 0 6px;color:${BRAND.ink};font-size:22px;font-weight:700;">Your order is on its way!</h2>
      <p style="margin:0;color:${BRAND.muted};font-size:15px;">Hi <strong>${customerName}</strong>, great news — your items have shipped.</p>
    </div>

    ${orderNumberBadge(orderNumber)}

    <h3 style="margin:20px 0 4px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Items Shipped</h3>
    ${itemsTable(items)}

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 20px;margin-top:24px;">
      <p style="margin:0;color:#0369a1;font-size:14px;">
        📦 Your package is on its way. Delivery times vary by location. You'll receive another email once it's delivered.
      </p>
    </div>

    ${ctaButton("Track My Order", `${BRAND.url}/customer/orders`)}
  `);

// ── Delivered email ────────────────────────────────────────────────────────
const deliveredEmail = ({ customerName, orderNumber, items, productId }) =>
  baseWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:12px;">✅</div>
      <h2 style="margin:0 0 6px;color:${BRAND.ink};font-size:22px;font-weight:700;">Order Delivered!</h2>
      <p style="margin:0;color:${BRAND.muted};font-size:15px;">Hi <strong>${customerName}</strong>, your order has arrived.</p>
    </div>

    ${orderNumberBadge(orderNumber)}

    <h3 style="margin:20px 0 4px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Items Delivered</h3>
    ${itemsTable(items)}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-top:24px;">
      <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">⭐ Enjoying your purchase?</p>
      <p style="margin:6px 0 0;color:#166534;font-size:13px;">We'd love to hear what you think! Leave a review to help other shoppers.</p>
    </div>

    <div style="display:flex;gap:12px;margin-top:24px;text-align:center;">
      <a href="${BRAND.url}/customer/orders"
        style="flex:1;display:inline-block;background:${BRAND.primary};color:#ffffff;font-weight:700;font-size:14px;padding:13px 20px;border-radius:50px;text-decoration:none;">
        View Orders
      </a>
      <a href="${BRAND.url}/customer/review/${productId}"
        style="flex:1;display:inline-block;background:#ffffff;color:${BRAND.ink};border:2px solid ${BRAND.border};font-weight:700;font-size:14px;padding:13px 20px;border-radius:50px;text-decoration:none;">
        Leave a Review
      </a>
    </div>
  `);

// ── Cancelled email ────────────────────────────────────────────────────────
const cancelledEmail = ({ customerName, orderNumber, items }) =>
  baseWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:12px;">😔</div>
      <h2 style="margin:0 0 6px;color:${BRAND.ink};font-size:22px;font-weight:700;">Item Cancelled</h2>
      <p style="margin:0;color:${BRAND.muted};font-size:15px;">Hi <strong>${customerName}</strong>, unfortunately one or more items in your order have been cancelled.</p>
    </div>

    ${orderNumberBadge(orderNumber)}

    <h3 style="margin:20px 0 4px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Cancelled Items</h3>
    ${itemsTable(items)}

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-top:24px;">
      <p style="margin:0;color:#dc2626;font-size:14px;">
        If you were charged for this item, a refund will be processed within 5–10 business days. Please contact support if you have questions.
      </p>
    </div>

    ${ctaButton("Browse More Products", `${BRAND.url}/products`)}
  `);

module.exports = { shippedEmail, deliveredEmail, cancelledEmail };
