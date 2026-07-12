// routes/public/categoryRoutes.js
const express = require("express");
const router = express.Router();

const { getCategory } = require("../../controllers/public/categoryController");

router.get("/", getCategory);

module.exports = router;
