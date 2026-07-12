//routes//admin//adminRoutes.js
const express = require("express");
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/dashboard", verifyToken, permitRoles("admin"), (req, res) => {
  res.json({ message: "Admin Dashboard Access Granted" });
});

module.exports = router;
