const generateOrderConfirmationEmail = ({
  customerName,
  orderNumber,
  items,
  totalAmount,
  address,
  phone,
}) => {
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6;">
        <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.name}</div>
        <div style="color: #9ca3af; font-size: 12px; margin-top: 2px;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: right;">
        <span style="font-weight: 700; color: #f97316; font-size: 14px;">$${(item.price * item.quantity).toFixed(2)}</span>
      </td>
    </tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <div style="max-width: 600px; margin: 40px auto; padding: 0 16px 40px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 8px;">🛍️</div>
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
        <span style="color: #f97316;">Multi</span>Vendor
      </h1>
      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.6); font-size: 13px;">Your order is confirmed!</p>
    </div>

    <!-- Main card -->
    <div style="background: #ffffff; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">

      <!-- Success badge -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; background: #dcfce7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 12px;">✅</div>
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 900;">Payment Successful!</h2>
        <p style="margin: 6px 0 0; color: #6b7280; font-size: 14px;">
          Hi <strong>${customerName}</strong>, thank you for your order.
        </p>
      </div>

      <!-- Order number -->
      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</span>
        <span style="color: #f97316; font-weight: 900; font-size: 16px;">${orderNumber}</span>
      </div>

      <!-- Order items -->
      <h3 style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #f3f4f6; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Product</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr style="background: #f9fafb;">
            <td style="padding: 16px; font-weight: 900; color: #111827; font-size: 15px;">Total</td>
            <td style="padding: 16px; text-align: right; font-weight: 900; color: #f97316; font-size: 18px;">$${totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery details -->
      <h3 style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Delivery Details</h3>
      <div style="background: #f9fafb; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 14px;">📍</span>
          <span style="color: #374151; font-size: 14px;">${address}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="font-size: 14px;">📞</span>
          <span style="color: #374151; font-size: 14px;">${phone}</span>
        </div>
      </div>

      <!-- Order tracking steps -->
      <h3 style="margin: 0 0 16px; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What's Next?</h3>
      <div style="display: flex; gap: 0; margin-bottom: 28px;">
        ${["🛒 Order Placed", "🚚 Shipped", "✅ Delivered"]
          .map(
            (step, i) => `
          <div style="flex: 1; text-align: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 8px;
              background: ${i === 0 ? "#f97316" : "#e5e7eb"};
              display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 36px;">
              ${step.split(" ")[0]}
            </div>
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: ${i === 0 ? "#f97316" : "#9ca3af"};">
              ${step.split(" ").slice(1).join(" ")}
            </p>
          </div>
          ${i < 2 ? `<div style="flex: 0.3; margin-top: 18px;"><div style="height: 2px; background: #e5e7eb; border-radius: 2px;"></div></div>` : ""}
        `,
          )
          .join("")}
      </div>

      <!-- CTA button -->
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/customer/orders"
          style="display: inline-block; background: #f97316; color: #ffffff; font-weight: 700; font-size: 14px;
          padding: 14px 32px; border-radius: 50px; text-decoration: none; letter-spacing: 0.02em;">
          View My Orders →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
        © ${new Date().getFullYear()} MultiVendorShop · Questions? 
        <a href="mailto:${process.env.EMAIL_USER}" style="color: #f97316; text-decoration: none;">Contact Support</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = generateOrderConfirmationEmail;
