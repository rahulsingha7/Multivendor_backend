const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getAllVendors,
  approveVendor,
  deleteVendor,
} = require("../../controllers/admin/vendorController");

router.use(verifyToken, permitRoles("admin"));

router.get("/", getAllVendors); 
router.put("/approve/:vendorId", approveVendor); 
router.delete("/:vendorId", deleteVendor); 

module.exports = router;
