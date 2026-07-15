//controllers//public//newsletterController
const NewsletterSubscriber = require("../../models/Newslettersubscriber");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await NewsletterSubscriber.findOne({
      email: normalizedEmail,
    });
    if (existing) {
      return res.status(200).json({
        message: "You're already subscribed!",
        alreadySubscribed: true,
      });
    }

    await NewsletterSubscriber.create({ email: normalizedEmail });
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        message: "You're already subscribed!",
        alreadySubscribed: true,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
