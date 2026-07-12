const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const TempOrder = require("../../models/TempOrder");
const Coupon = require("../../models/Coupon");

exports.createCheckoutSession = async (req, res) => {
  const { customerId, cartItems, shippingInfo, couponCode } = req.body;

  try {
    let discountAmount = 0;
    let appliedCoupon = null;
    const originalTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Validate coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive) {
        if (coupon.discountType === "percentage") {
          discountAmount = (originalTotal * coupon.discountValue) / 100;
        } else {
          discountAmount = Math.min(coupon.discountValue, originalTotal);
        }
        appliedCoupon = coupon;
        // Increment usage count
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);

    // Build Stripe line items
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add discount as a negative line item if coupon applied
    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Coupon: ${appliedCoupon.code} (${appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}% off` : `$${appliedCoupon.discountValue} off`})`,
          },
          unit_amount: -Math.round(discountAmount * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      line_items: lineItems,
    });

    await TempOrder.create({
      sessionId: session.id,
      customer: customerId,
      cartItems,
      phone: shippingInfo.phone,
      address: shippingInfo.address,
      couponCode: appliedCoupon?.code || null,
      discountAmount,
      finalTotal,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    res.status(500).json({ error: "Checkout session failed" });
  }
};
