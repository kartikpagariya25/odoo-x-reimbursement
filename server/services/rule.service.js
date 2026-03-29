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
exports.matchExpenseToRule = async (category, companyId, employeeId = null) => {
  try {
    let rule = null;

    if (employeeId) {
      rule = await ApprovalRule.findOne({
        companyId,
        employeeId,
        isActive: true,
        $or: [{ category }, { category: { $exists: false } }, { category: null }, { category: "" }]
      }).populate("steps.approvers.userId");
    }

    if (!rule) {
      rule = await ApprovalRule.findOne({
        category,
        companyId,
        isActive: true,
        employeeId: null
      }).populate("steps.approvers.userId");
    }

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
        rule.isManagerApprover,
        rule.managerId
      );

      const sortedApprovers = [...approversList].sort((a, b) => (a.order || 0) - (b.order || 0));

      approvalChain.push({
        stepIndex: step.stepIndex,
        status: "PENDING",
        approvers: sortedApprovers.map(approver => ({
          userId: approver._id,
          status: "PENDING",
          isRequired: Boolean(approver.isRequired),
          order: approver.order || 0
        })),
        isParallel: step.isParallel || false,
        ruleType: step.ruleType,
        threshold: step.threshold || rule.minApprovalPercentage || 100
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
exports.getApproversForStep = async (
  step,
  employeeId,
  companyId,
  isManagerApprover,
  managerIdOverride = null
) => {
  try {
    let approvers = [];

    // Add specific approvers from rule
    if (step.approvers && step.approvers.length > 0) {
      const approverIds = step.approvers.map(a => a.userId);
      const approverUsers = await User.find({
        _id: { $in: approverIds },
        companyId
      });

      const approverMap = new Map();
      for (const user of approverUsers) {
        approverMap.set(String(user._id), user);
      }

      for (const stepApprover of step.approvers) {
        const mapped = approverMap.get(String(stepApprover.userId));
        if (mapped) {
          approvers.push({
            ...mapped.toObject(),
            _id: mapped._id,
            isRequired: Boolean(stepApprover.isRequired),
            order: stepApprover.order || 0
          });
        }
      }
    }

    // Add manager if enabled
    if (isManagerApprover) {
      let managerUser = null;

      if (managerIdOverride) {
        managerUser = await User.findOne({ _id: managerIdOverride, companyId });
      }

      if (!managerUser) {
        const employee = await User.findById(employeeId).populate("managerId");
        if (employee && employee.managerId) {
          managerUser = employee.managerId;
        }
      }

      if (managerUser) {
        const managerExists = approvers.find(a => a._id.equals(managerUser._id));
        if (!managerExists) {
          approvers.push({
            ...managerUser.toObject(),
            _id: managerUser._id,
            isRequired: false,
            order: 0
          });
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
