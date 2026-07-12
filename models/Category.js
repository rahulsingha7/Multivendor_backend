// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // normalize case
    trim: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);
