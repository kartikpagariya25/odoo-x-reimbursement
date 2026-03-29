const mongoose = require("mongoose");

const normalizeRuleType = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.toLowerCase();
};

const approvalRuleSchema = new mongoose.Schema({
  name: String,
  description: String,

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  category: String,
  isManagerApprover: Boolean,
  isSequence: {
    type: Boolean,
    default: true
  },
  minApprovalPercentage: {
    type: Number,
    default: 100
  },
  isActive: Boolean,

  steps: [
    {
      stepIndex: Number,
      approvers: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
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
      ],
      ruleType: {
        type: String,
        enum: ["sequential", "percentage", "specific", "hybrid"],
        set: normalizeRuleType
      },
      threshold: Number,
      isParallel: Boolean
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("ApprovalRule", approvalRuleSchema);