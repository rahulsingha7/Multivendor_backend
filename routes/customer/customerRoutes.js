//routes//customer//customerRoutes.js
const express = require("express");
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/dashboard", verifyToken, permitRoles("customer"), (req, res) => {
  res.json({ message: "customer Dashboard Access Granted" });
});

module.exports = router;
