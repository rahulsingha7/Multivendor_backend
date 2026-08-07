const crypto = require("crypto");
const PayIdOrder = require("../../models/PayIdOrder");
const Coupon = require("../../models/Coupon");
const { zeptoRequest } = require("../../utils/zeptoClient");

// NOTE: "Add a Receivable Contact" (the endpoint that assigns a customer
// their own PayID to pay into) must be enabled on your Zepto account first —
// this requires emailing Zepto support with your legal business name, a
// domain you own for PayID emails, and an alias_name. Until that's done,
// calls below will fail with a 404/403 from Zepto.

const PAYID_EMAIL_DOMAIN = process.env.ZEPTO_PAYID_EMAIL_DOMAIN; // e.g. "pay.yourdomain.com"

const generateIdempotencyKey = () => crypto.randomUUID();

exports.createPayIdOrder = async (req, res) => {
  const {
    customerId,
    customerName,
    customerEmail,
    cartItems,
    shippingInfo,
    couponCode,
  } = req.body;

  try {
    let discountAmount = 0;
    let appliedCoupon = null;
    const originalTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive) {
        discountAmount =
          coupon.discountType === "percentage"
            ? (originalTotal * coupon.discountValue) / 100
            : Math.min(coupon.discountValue, originalTotal);
        appliedCoupon = coupon;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);
    const amountInCents = Math.round(finalTotal * 100);

    // 1. Create a Receivable Contact for this customer — assigns them a
    //    personal PayID from your pooled domain (simpler than on-demand
    //    per-order PayIDs, and avoids re-registering a PayID every order).
    const contact = await zeptoRequest("post", "/contacts/receivable", {
      name: customerName,
      email: customerEmail,
      payid_email_domain: PAYID_EMAIL_DOMAIN,
    });

    const contactId = contact?.data?.id;
    const payIdEmail = contact?.data?.payid_details?.payid_email;

    if (!contactId) {
      throw new Error("Zepto did not return a contact id");
    }

    // 2. Create the actual Payment Request against that contact.
    //    matures_at controls when Zepto will attempt/allow processing —
    //    setting it to "now" means it's payable immediately.
    const maturesAt = new Date().toISOString();

    const paymentRequest = await zeptoRequest(
      "post",
      "/payment_requests",
      {
        description: `Order payment`,
        matures_at: maturesAt,
        amount: amountInCents,
        authoriser_contact_id: contactId,
        metadata: { source: "multivendor-checkout" },
      },
      { "Idempotency-Key": generateIdempotencyKey() },
    );

    const paymentRequestId = paymentRequest?.data?.id;

    // Use the payment request id as our own reference for matching webhooks
    const reference =
      paymentRequestId ||
      `MV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const order = await PayIdOrder.create({
      reference,
      customer: customerId,
      cartItems,
      phone: shippingInfo.phone,
      address: shippingInfo.address,
      couponCode: appliedCoupon?.code || null,
      discountAmount,
      finalTotal,
      zeptoContactId: contactId,
      zeptoPaymentRequestId: paymentRequestId,
      payIdEmail,
    });

    res.json({
      payId: payIdEmail,
      reference: order.reference,
      amount: finalTotal,
      orderId: order._id,
    });
  } catch (error) {
    console.error(
      "PayID order creation failed:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error:
        "Could not create PayID order. If this is a new integration, confirm Zepto has enabled Receivable Contacts for your account.",
    });
  }
};

exports.getPayIdOrderStatus = async (req, res) => {
  try {
    const order = await PayIdOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ status: order.status });
  } catch {
    res.status(500).json({ message: "Failed to fetch order status" });
  }
};

// Called by Zepto's webhook when the PayID payment request is fulfilled.
//
// NOTE: this route is mounted with bodyParser.raw() (like the Stripe webhook)
// so req.body arrives as a Buffer, not a parsed object — parse it here.
// TODO: verify Zepto's webhook signature (check their Webhooks docs for the
// exact header/algorithm) before trusting the payload, once we can see a
// real delivered webhook payload from the sandbox.
exports.handleZeptoWebhook = async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString("utf8"));

    // NOTE: exact event shape (event.type, event.data.id, etc.) needs
    // confirming against Zepto's actual webhook payload — this assumes a
    // reasonably standard shape based on their REST resource naming.
    const paymentRequestId = event?.data?.payment_request_id || event?.data?.id;

    if (!paymentRequestId) {
      return res
        .status(400)
        .json({ message: "Missing payment request id in webhook payload" });
    }

    const order = await PayIdOrder.findOne({
      zeptoPaymentRequestId: paymentRequestId,
    });

    if (!order) {
      console.warn(
        `PayID webhook: no order found for payment request ${paymentRequestId}`,
      );
      return res.status(200).json({ received: true });
    }

    if (order.status === "paid") {
      return res.status(200).json({ received: true });
    }

    order.status = "paid";
    order.paidAt = new Date();
    await order.save();

    // TODO: mirror whatever Order-creation / confirmation-email logic the
    // Stripe webhook does, so PayID orders end up as real Order records too.

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Zepto webhook handling failed:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
