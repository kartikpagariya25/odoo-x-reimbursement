const mongoose = require('mongoose');
const { STATUS, EXPENSE_CATEGORIES } = require('../config/constants');

const normalizeWorkflowStatus = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.toUpperCase();
};

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
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule',
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
  merchantName: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  receiptImage: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PENDING,
    set: normalizeWorkflowStatus
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  approvalChain: [
    {
      stepIndex: Number,
      status: {
        type: String,
        enum: Object.values(STATUS),
        set: normalizeWorkflowStatus,
        default: STATUS.PENDING
      },
      approvers: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          status: {
            type: String,
            enum: Object.values(STATUS),
            set: normalizeWorkflowStatus,
            default: STATUS.PENDING
          }
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
