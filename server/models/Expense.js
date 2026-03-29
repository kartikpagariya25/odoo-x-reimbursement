const mongoose = require('mongoose');
const { STATUS, EXPENSE_CATEGORIES } = require('../config/constants');

const expenseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  convertedAmount: {
    type: Number,
    required: true,
  },
  companyCurrency: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(EXPENSE_CATEGORIES),
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  receiptImage: {
    type: String, // Path or URL to the receipt
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PENDING,
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule',
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
