const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const permitRoles = require("../../middleware/roleMiddleware");
const {
  getAllUsers,
  deleteUser,
} = require("../../controllers/admin/userController");

router.use(verifyToken, permitRoles("admin"));

router.get("/", getAllUsers);
router.delete("/:id", deleteUser);

module.exports = router;
