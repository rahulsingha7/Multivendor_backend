//routes//admin//productRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getAllProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
} = require("../../controllers/admin/productController");

// Protect all admin product routes
router.use(verifyToken);
router.use(permitRoles("admin"));

router.get("/", getAllProducts);
router.put("/:id/approve", approveProduct);
router.put("/:id/reject", rejectProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
