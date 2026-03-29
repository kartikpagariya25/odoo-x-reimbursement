const mongoose = require('mongoose');
const { STATUS } = require('../config/constants');

const normalizeAction = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.toUpperCase();
};

const approvalActionSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true,
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: Object.values(STATUS),
    set: normalizeAction,
    required: true,
  },
  stepIndex: {
    type: Number, // 0 for strict manager, 1+ for formal chain steps
    required: true,
  },
  comment: {
    type: String,
    required: function() { return this.action === STATUS.REJECTED; }
  }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalAction', approvalActionSchema);
