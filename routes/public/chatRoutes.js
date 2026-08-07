// routes/public/chatRoutes.js
const express = require("express");
const router = express.Router();

const { sendMessage } = require("../../controllers/public/chatController");

router.post("/message", sendMessage);

module.exports = router;
