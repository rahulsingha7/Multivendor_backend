const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const TempOrder = require("../../models/TempOrder");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");
const generateOrderConfirmationEmail = require("../../utils/orderConfirmationEmail");
const { dispatch } = require("../../utils/webhookDispatcher");

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Invalid webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const tempOrder = await TempOrder.findOne({ sessionId: session.id });

      if (!tempOrder) {
        throw new Error("No matching temp order found for this session");
      }

      const products = tempOrder.cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        vendor: item.vendorId,
      }));

      const orderData = {
        customer: tempOrder.customer,
        products,
        totalAmount: session.amount_total / 100,
        paymentIntentId: session.payment_intent,
        phone: tempOrder.phone,
        address: tempOrder.address,
      };

      const order = await Order.create(orderData);

      // Reduce stock
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          await product.save();
        }
      }

      await TempOrder.deleteOne({ _id: tempOrder._id });

      // Fire order.created webhook
      dispatch("order.created", {
        orderId: order._id,
        totalAmount: order.totalAmount,
        customer: { id: tempOrder.customer },
        products: tempOrder.cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        createdAt: order.createdAt,
      }).catch(() => {});

      // ── Send confirmation email ──
      try {
        const customer = await User.findById(tempOrder.customer).select(
          "name email",
        );

        if (customer?.email) {
          const orderNumber = `#${order._id.toString().slice(-6).toUpperCase()}`;

          const html = generateOrderConfirmationEmail({
            customerName: customer.name || "Valued Customer",
            orderNumber,
            items: tempOrder.cartItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: order.totalAmount,
            address: tempOrder.address,
            phone: tempOrder.phone,
          });

          await sendEmail(
            customer.email,
            `✅ Order Confirmed ${orderNumber} — MultiVendor Shop`,
            html,
          );

          console.log(`📧 Confirmation email sent to ${customer.email}`);
        }
      } catch (emailErr) {
        // Don't fail the webhook if email fails — order is already created
        console.error("Email sending failed (non-critical):", emailErr.message);
      }
    } catch (error) {
      console.error("❌ Failed to process Stripe webhook:", error);
      return res.status(400).json({ error: "Order creation failed" });
    }
  }

  res.status(200).json({ received: true });
};
