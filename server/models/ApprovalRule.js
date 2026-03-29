const mongoose = require("mongoose");

const normalizeRuleType = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.toLowerCase();
};

const approvalRuleSchema = new mongoose.Schema({
  name: String,

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  category: String,
  isManagerApprover: Boolean,
  isActive: Boolean,

  steps: [
    {
      stepIndex: Number,
      approvers: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
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