const mongoose = require("mongoose");

const normalizeWorkflowStatus = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.toUpperCase();
};

const expenseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ApprovalRule"
  },

  amount: Number,
  currency: String,
  convertedAmount: Number,
  companyCurrency: String,

  category: String,
  description: String,
  merchantName: String,
  date: Date,
  receiptImage: String,

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
    set: normalizeWorkflowStatus
  },

  currentStep: Number,

  approvalChain: [
    {
      stepIndex: Number,
      ruleType: String,
      isParallel: Boolean,
      threshold: Number,
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        set: normalizeWorkflowStatus
      },
      approvers: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            set: normalizeWorkflowStatus
          },
          isRequired: {
            type: Boolean,
            default: false
          },
          order: {
            type: Number,
            default: 0
          }
        }
      ]
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);