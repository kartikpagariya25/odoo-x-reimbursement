const mongoose = require('mongoose');
const { RULE_TYPES } = require('../config/constants');

const stepSchema = new mongoose.Schema({
  approvers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  ruleType: {
    type: String,
    enum: Object.values(RULE_TYPES),
    required: true,
  },
  threshold: {
    type: Number, // Only relevant for PERCENTAGE and HYBRID
    min: 1,
    max: 100
  },
  keyApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Only relevant for SPECIFIC and HYBRID
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
  isManagerApprover: {
    type: Boolean,
    default: false,
  },
  steps: [stepSchema]
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
