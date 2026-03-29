const mongoose = require('mongoose');
const { RULE_TYPES } = require('../config/constants');

const normalizeRuleType = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.toLowerCase();
};

const stepSchema = new mongoose.Schema({
  stepIndex: Number,
  approvers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  ruleType: {
    type: String,
    enum: Object.values(RULE_TYPES),
    set: normalizeRuleType,
    required: true,
  },
  threshold: {
    type: Number,
    min: 1,
    max: 100
  },
  isParallel: {
    type: Boolean,
    default: false
  },
  keyApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Only relevant if specific rule requires it
  }
});

const approvalRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: String,
  isManagerApprover: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  steps: [stepSchema]
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
