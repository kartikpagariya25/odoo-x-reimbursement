const Expense = require("../models/Expense");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

const {
  approveStep,
  rejectStep,
  getPendingApprovalsForUser,
  createAuditLog
} = require("../services/workflow.service");

/**
 * Approve expense (current approval step)
 * POST /expenses/:id/approve
 * Users approve their assigned step in the approval chain
 */
exports.approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const { userId, companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    // Update approval step
    const expense = await approveStep(id, userId, comment || "");

    // Audit log
    await createAuditLog(userId, companyId, "EXPENSE_APPROVED_STEP", {
      expenseId: id,
      stepIndex: expense.currentStep - 1,
      status: expense.status
    });

    await expense.populate("employeeId", "name email");
    await expense.populate("approvalChain.approvers.userId", "name email");

    return res.status(200).json({
      success: true,
      data: expense,
      message: "Expense approved"
    });
  } catch (error) {
    console.error("❌ Approve expense error:", error);
    return res.status(400).json({ error: error.message || "Failed to approve expense" });
  }
};

/**
 * Reject expense
 * POST /expenses/:id/reject
 * Users reject an expense at their assigned step
 */
exports.rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const { userId, companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    // Update approval step
    const expense = await rejectStep(id, userId, comment || "");

    // Audit log
    await createAuditLog(userId, companyId, "EXPENSE_REJECTED", {
      expenseId: id,
      reason: comment || "",
      amount: expense.amount
    });

    await expense.populate("employeeId", "name email");
    await expense.populate("approvalChain.approvers.userId", "name email");

    return res.status(200).json({
      success: true,
      data: expense,
      message: "Expense rejected"
    });
  } catch (error) {
    console.error("❌ Reject expense error:", error);
    return res.status(400).json({ error: error.message || "Failed to reject expense" });
  }
};

/**
 * Get pending approvals for current user
 * GET /expenses/pending
 * Returns all expenses awaiting approval from this user
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyId = req.user.companyId;

    const pendingApprovals = await getPendingApprovalsForUser(userId, companyId);

    // Format response to return simpler structure
    const formattedPendingApprovals = pendingApprovals.map(item => ({
      ...item.expense.toObject(),
      currentStepIndex: item.stepIndex,
      currentStep: item.step
    }));

    return res.status(200).json({
      success: true,
      data: formattedPendingApprovals,
      count: formattedPendingApprovals.length
    });
  } catch (error) {
    console.error("❌ Get pending approvals error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch pending approvals" });
  }
};
