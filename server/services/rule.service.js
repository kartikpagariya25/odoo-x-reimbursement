const ApprovalRule = require("../models/ApprovalRule");
const User = require("../models/User");

/**
 * Find approval rule matching an expense
 * Matches by: category + company
 * Respects: isActive flag
 * 
 * @param {string} category - Expense category
 * @param {string} companyId - Company ObjectId
 * @returns {Object|null} Matching ApprovalRule or null
 */
exports.matchExpenseToRule = async (category, companyId) => {
  try {
    const rule = await ApprovalRule.findOne({
      category,
      companyId,
      isActive: true
    }).populate("steps.approvers.userId");

    return rule;
  } catch (error) {
    console.error("❌ Error matching expense to rule:", error);
    throw error;
  }
};

/**
 * Build approval chain from rule
 * Creates approval steps from rule, resolving approvers
 * Handles: manager auto-assignment if isManagerApprover is true
 * 
 * @param {Object} rule - ApprovalRule document
 * @param {string} employeeId - Employee ObjectId
 * @param {string} companyId - Company ObjectId
 * @returns {Array} Approval chain array
 */
exports.buildApprovalChain = async (rule, employeeId, companyId) => {
  try {
    if (!rule || !rule.steps) {
      throw new Error("Invalid rule provided");
    }

    const approvalChain = [];

    for (const step of rule.steps) {
      const approversList = await this.getApproversForStep(
        step,
        employeeId,
        companyId,
        rule.isManagerApprover
      );

      approvalChain.push({
        stepIndex: step.stepIndex,
        status: "PENDING",
        approvers: approversList.map(approver => ({
          userId: approver._id,
          status: "PENDING"
        })),
        isParallel: step.isParallel || false,
        ruleType: step.ruleType
      });
    }

    return approvalChain;
  } catch (error) {
    console.error("❌ Error building approval chain:", error);
    throw error;
  }
};

/**
 * Get approvers for a specific approval step
 * Handles 4 rule types:
 * - sequential: Fixed list of approvers
 * - percentage: Based on percentage of amount (not used for approval)
 * - specific: Specific user IDs
 * - hybrid: Mix of specific + manager
 * 
 * Also auto-includes manager if rule.isManagerApprover is true
 * 
 * @param {Object} step - ApprovalRule step
 * @param {string} employeeId - Employee ObjectId
 * @param {string} companyId - Company ObjectId
 * @param {boolean} isManagerApprover - Whether manager should be auto-included
 * @returns {Array} Array of User objects who should approve this step
 */
exports.getApproversForStep = async (step, employeeId, companyId, isManagerApprover) => {
  try {
    let approvers = [];

    // Add specific approvers from rule
    if (step.approvers && step.approvers.length > 0) {
      const approverIds = step.approvers.map(a => a.userId);
      const approverUsers = await User.find({
        _id: { $in: approverIds },
        companyId
      });
      approvers = [...approvers, ...approverUsers];
    }

    // Add manager if enabled
    if (isManagerApprover) {
      const employee = await User.findById(employeeId).populate("managerId");
      if (employee && employee.managerId) {
        const managerExists = approvers.find(a => a._id.equals(employee.managerId._id));
        if (!managerExists) {
          approvers.push(employee.managerId);
        }
      }
    }

    // Remove duplicates
    const uniqueApprovers = [];
    const seenIds = new Set();
    for (const approver of approvers) {
      if (!seenIds.has(approver._id.toString())) {
        uniqueApprovers.push(approver);
        seenIds.add(approver._id.toString());
      }
    }

    return uniqueApprovers;
  } catch (error) {
    console.error("❌ Error getting approvers for step:", error);
    throw error;
  }
};
