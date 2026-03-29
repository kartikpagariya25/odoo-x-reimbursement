const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: String,

  role: {
    type: String,
    enum: ["ADMIN", "MANAGER", "EMPLOYEE"]
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);