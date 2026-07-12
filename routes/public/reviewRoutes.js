// routes/public/reviewRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPublicReviews,
} = require("../../controllers/public/reviewController");

router.get("/public", getPublicReviews);

module.exports = router;
