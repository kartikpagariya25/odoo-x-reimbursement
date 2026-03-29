const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
  },
  currencyCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z]{3}$/
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
