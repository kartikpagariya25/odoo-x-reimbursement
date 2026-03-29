const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  country: String,
  currencyCode: {
    type: String,
    uppercase: true,
    trim: true,
    match: /^[A-Z]{3}$/
  }
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);