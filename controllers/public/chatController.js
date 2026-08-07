// controller/public/chatController.js
// FAQ chatbot powered by Google's Gemini API (free tier). The knowledge base
// below is fed to the model as system context so it can answer naturally,
// including rephrased questions, rather than doing rigid keyword matching.
//
// Falls back to a simple rule-based match if the Gemini call fails (e.g. rate
// limit hit, missing API key) so the widget never goes fully silent.

const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const KNOWLEDGE_BASE = `
You are the support assistant for MultiVendor Shop, an online multivendor marketplace.
Answer customer questions ONLY using the information below. Keep answers short
(2-4 sentences), friendly, and conversational. If a question is unrelated to
the store or not covered below, politely say you're not sure and suggest
contacting support via the Contact page.

Shipping: Free shipping on orders over $75. Standard delivery takes 3-7
business days depending on location and vendor.

Order tracking: Customers can track orders from the My Orders page. Statuses
are: paid, shipped, delivered, cancelled.

Cancellations: Orders can be cancelled before they're marked as shipped, via
My Orders > Cancel.

Payments: We accept all major debit/credit cards via Stripe, plus Apple Pay
and Google Pay where supported by the customer's device/browser.

Becoming a vendor: Apply via the "Sell With Us" link. Vendor accounts require
admin approval, typically within 1-2 business days.

Coupons: Applied at checkout in the Promo Code field. Discounts apply
automatically once a valid code is entered.

Account/password issues: Use "Forgot Password" on the login page to reset via
email link.
`.trim();

// --- Rule-based fallback (kept from the original implementation) ---
const FAQ_ENTRIES = [
  {
    keywords: ["shipping", "delivery", "ship", "deliver", "arrive"],
    answer:
      "We offer free shipping on all orders over $75. Standard delivery usually takes 3-7 business days depending on your location and the vendor.",
  },
  {
    keywords: ["track", "tracking", "where is my order", "order status"],
    answer:
      "You can track your order from the 'My Orders' page in your account. Each order shows its current status: paid, shipped, delivered, or cancelled.",
  },
  {
    keywords: ["cancel", "cancellation"],
    answer:
      "Orders can be cancelled before they're marked as shipped. Go to My Orders and select 'Cancel' next to the eligible item.",
  },
  {
    keywords: ["payment", "pay", "card", "stripe", "apple pay", "google pay"],
    answer:
      "We accept all major debit and credit cards through Stripe, along with Apple Pay and Google Pay where supported by your device and browser.",
  },
  {
    keywords: ["vendor", "sell", "become a seller", "seller account"],
    answer:
      "You can apply to become a vendor from the 'Sell With Us' link. Vendor accounts require admin approval, which usually takes 1-2 business days.",
  },
  {
    keywords: ["coupon", "discount", "promo code", "voucher"],
    answer:
      "You can apply a coupon code at checkout in the 'Promo Code' field. Discounts are applied automatically once a valid code is entered.",
  },
  {
    keywords: ["account", "password", "login", "sign in", "forgot password"],
    answer:
      "If you're having trouble signing in, use the 'Forgot Password' link on the login page to reset it. You'll receive a reset link by email.",
  },
  {
    keywords: ["contact", "support", "help", "human", "representative"],
    answer:
      "For anything I can't help with, you can reach our support team through the Contact page, and we'll get back to you as soon as possible.",
  },
];

const FALLBACK_ANSWER =
  "I'm not sure about that one yet. Could you rephrase your question, or check our Contact page for direct support?";

const normalize = (text) => text.toLowerCase().trim();

const findRuleBasedMatch = (message) => {
  const text = normalize(message);
  let bestEntry = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    const score = entry.keywords.reduce(
      (acc, kw) => (text.includes(kw) ? acc + 1 : acc),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry ? bestEntry.answer : FALLBACK_ANSWER;
};

// --- Gemini-backed response ---
const askGemini = async (message) => {
  const res = await axios.post(
    GEMINI_URL,
    {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${KNOWLEDGE_BASE}\n\nCustomer question: ${message}` },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 900,
        temperature: 0.4,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      timeout: 20000,
    },
  );

  const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("Empty response from Gemini");
  return reply.trim();
};

exports.sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    if (!GEMINI_API_KEY) {
      // No key configured — use the free rule-based fallback directly.
      return res.json({ reply: findRuleBasedMatch(message) });
    }

    const reply = await askGemini(message);
    res.json({ reply });
  } catch (err) {
    console.error(
      "Gemini call failed, falling back to rule-based:",
      err.message,
    );
    try {
      res.json({ reply: findRuleBasedMatch(message) });
    } catch {
      res.status(500).json({ message: "Failed to process message" });
    }
  }
};
