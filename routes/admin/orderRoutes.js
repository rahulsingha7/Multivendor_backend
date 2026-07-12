const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const { getAllOrders } = require("../../controllers/admin/orderController");

router.use(verifyToken, permitRoles("admin"));

router.get("/", getAllOrders);

module.exports = router;
