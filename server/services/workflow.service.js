const Expense = require("../models/Expense");
const ApprovalAction = require("../models/ApprovalAction");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

/**
 * Check if expense approval is complete
 * All steps must be APPROVED for final approval
 * If any step is REJECTED, entire expense is rejected
 * 
 * @param {Object} expense - Expense document
 * @returns {Object} { isComplete: bool, status: "APPROVED"|"REJECTED"|"PENDING" }
 */
exports.isApprovalComplete = (expense) => {
  if (!expense.approvalChain || expense.approvalChain.length === 0) {
    return { isComplete: false, status: "PENDING" };
  }

  let allApproved = true;
  let anyRejected = false;

  for (const step of expense.approvalChain) {
    if (step.status === "REJECTED") {
      anyRejected = true;
      break;
    }

    if (step.status !== "APPROVED") {
      allApproved = false;
    }
  }

  if (anyRejected) {
    return { isComplete: true, status: "REJECTED" };
  }

  if (allApproved) {
    return { isComplete: true, status: "APPROVED" };
  }

  return { isComplete: false, status: "PENDING" };
};

/**
 * Get next step index that needs approval
 * Handles: sequential (one step at a time) vs parallel (multiple approvers per step)
 * 
 * @param {Object} expense - Expense document
 * @returns {number} Next step index or -1 if no more steps
 */
exports.getNextStep = (expense) => {
  if (!expense.approvalChain || expense.approvalChain.length === 0) {
    return -1;
  }

  for (let i = 0; i < expense.approvalChain.length; i++) {
    const step = expense.approvalChain[i];
    if (step.status === "PENDING") {
      return i;
    }
  }

  return -1;
};

/**
 * Approve an approval step
 * User approves their part of the current step
 * If all parallel approvers in step done, mark step as APPROVED
 * Move to next step if sequential, or check if final step done
 * 
 * @param {string} expenseId - Expense ObjectId
 * @param {string} approverId - Approver User ObjectId
 * @param {string} comment - Optional approval comment
 * @returns {Object} Updated expense
 */
exports.approveStep = async (expenseId, approverId, comment = "") => {
  try {
    const expense = await Expense.findById(expenseId).populate("approvalChain.approvers.userId");

    if (!expense) {
      throw new Error("Expense not found");
    }

    // Find current step
    const currentStepIndex = this.getNextStep(expense);
    if (currentStepIndex === -1) {
      throw new Error("No pending approval steps");
    }

    const currentStep = expense.approvalChain[currentStepIndex];

    // Find approver in current step
    const approver = currentStep.approvers.find(a =>
      a.userId._id.equals(approverId)
    );

    if (!approver) {
      throw new Error("User is not an approver for this step");
    }

    if (approver.status !== "PENDING") {
      throw new Error("This approver has already acted on this step");
    }

    // Mark approver as approved
    approver.status = "APPROVED";

    // Check if all approvers in step are approved (for parallel) or just mark done (for sequential)
    const allApproversDone = currentStep.approvers.every(a => a.status !== "PENDING");

    if (allApproversDone) {
      currentStep.status = "APPROVED";
      expense.currentStep = currentStepIndex + 1;
    }

    // Check if entire approval is complete
    const completion = this.isApprovalComplete(expense);
    if (completion.isComplete) {
      expense.status = completion.status;
    }

    await expense.save();

    // Create approval action record
    await ApprovalAction.create({
      expenseId: expense._id,
      approverId,
      action: "APPROVED",
      stepIndex: currentStepIndex,
      comment
    });

    return expense;
  } catch (error) {
    console.error("❌ Error approving step:", error);
    throw error;
  }
};

/**
 * Reject an approval step
 * When rejected, expense goes back to PENDING but with rejection status
 * No further approvals needed - rejected expenses don't proceed
 * 
 * @param {string} expenseId - Expense ObjectId
 * @param {string} approverId - Rejector User ObjectId
 * @param {string} comment - Rejection reason/comment
 * @returns {Object} Updated expense
 */
exports.rejectStep = async (expenseId, approverId, comment = "") => {
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    // Find current step
    const currentStepIndex = this.getNextStep(expense);
    if (currentStepIndex === -1) {
      throw new Error("No pending approval steps");
    }

    const currentStep = expense.approvalChain[currentStepIndex];

    // Find approver in current step
    const approver = currentStep.approvers.find(a =>
      a.userId.equals(approverId) || a.userId._id.equals(approverId)
    );

    if (!approver) {
      throw new Error("User is not an approver for this step");
    }

    if (approver.status !== "PENDING") {
      throw new Error("This approver has already acted on this step");
    }

    // Mark step and approver as rejected
    approver.status = "REJECTED";
    currentStep.status = "REJECTED";
    expense.status = "REJECTED";

    await expense.save();

    // Create approval action record
    await ApprovalAction.create({
      expenseId: expense._id,
      approverId,
      action: "REJECTED",
      stepIndex: currentStepIndex,
      comment
    });

    return expense;
  } catch (error) {
    console.error("❌ Error rejecting step:", error);
    throw error;
  }
};

/**
 * Create audit log entry
 * Logs all important workflow actions for compliance/tracking
 * 
 * @param {string} actorId - User who performed action
 * @param {string} companyId - Company context
 * @param {string} action - Action name (e.g., "EXPENSE_APPROVED")
 * @param {Object} details - Additional details object
 */
exports.createAuditLog = async (actorId, companyId, action, details) => {
  try {
    await AuditLog.create({
      actorId,
      companyId,
      action,
      details
    });
  } catch (error) {
    console.error("❌ Error creating audit log:", error);
    // Don't throw - audit log failure shouldn't block operations
  }
};

/**
 * Get pending approvals for a user
 * Returns all expenses where user is an approver in the current step
 * 
 * @param {string} userId - Approver User ObjectId
 * @param {string} companyId - Company ObjectId
 * @returns {Array} Array of expenses with pending approvals
 */
exports.getPendingApprovalsForUser = async (userId, companyId) => {
  try {
    // Find all expenses in company that are still PENDING
    const expenses = await Expense.find({
      companyId,
      status: "PENDING"
    })
      .populate("employeeId", "name email")
      .populate("ruleId", "name category")
      .populate("approvalChain.approvers.userId", "name email");

    // Filter to only those where user is an approver in the current pending step
    const pendingForUser = [];

    for (const expense of expenses) {
      // Find current step
      const currentStepIndex = this.getNextStep(expense);
      if (currentStepIndex === -1) continue;

      const currentStep = expense.approvalChain[currentStepIndex];

      // Check if user is an approver in this step
      const isApprover = currentStep.approvers.some(a =>
        (a.userId._id && a.userId._id.equals(userId)) ||
        (a.userId && a.userId.equals(userId))
      );

      if (isApprover) {
        pendingForUser.push({
          expense,
          stepIndex: currentStepIndex,
          step: currentStep
        });
      }
    }

    return pendingForUser;
  } catch (error) {
    console.error("❌ Error getting pending approvals:", error);
    throw error;
  }
};
