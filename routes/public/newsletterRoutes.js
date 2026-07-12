// routes/public/newsletterRoutes.js
const express = require("express");
const router = express.Router();

const { subscribe } = require("../../controllers/public/newsletterController");
const { validateNewsletter } = require("../../middleware/validationMiddleware");

router.post("/subscribe", validateNewsletter, subscribe);

module.exports = router;
