const mongoose = require("mongoose");

const normalizeAction = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.toUpperCase();
};

const approvalActionSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense"
  },

  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  stepIndex: Number,
  action: {
    type: String,
    enum: ["APPROVED", "REJECTED"],
    set: normalizeAction
  },
  comment: String

}, { timestamps: true });

module.exports = mongoose.model("ApprovalAction", approvalActionSchema);