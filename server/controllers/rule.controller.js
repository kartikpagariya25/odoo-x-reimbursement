const ApprovalRule = require("../models/ApprovalRule");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Create approval rule (Admin only)
 * POST /rules
 * Body: { name, category, steps, isManagerApprover }
 */
exports.createRule = async (req, res) => {
  try {
    const {
      name,
      category,
      steps,
      isManagerApprover,
      employeeId,
      managerId,
      description,
      isSequence,
      minApprovalPercentage
    } = req.body;
    const companyId = req.user.companyId;

    const employee = await User.findOne({
      _id: employeeId,
      companyId,
      role: "EMPLOYEE"
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found in company" });
    }

    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        companyId,
        role: { $in: ["ADMIN", "MANAGER"] }
      });

      if (!manager) {
        return res.status(404).json({ error: "Manager not found in company" });
      }
    }

    const existingRule = await ApprovalRule.findOne({
      companyId,
      employeeId,
      isActive: true
    });

    if (existingRule) {
      return res.status(400).json({ error: "An active rule already exists for this employee" });
    }

    // Verify all approver IDs exist in company
    const allApproverIds = [];
    for (const step of steps) {
      for (const approver of step.approvers) {
        allApproverIds.push(approver.userId);
      }
    }

    const approverUsers = await User.find({
      _id: { $in: allApproverIds },
      companyId
    });

    if (approverUsers.length !== allApproverIds.length) {
      return res.status(404).json({ error: "One or more approvers not found in company" });
    }

    // Create rule
    const rule = await ApprovalRule.create({
      name,
      description: description || "",
      category: category || "Other",
      employeeId,
      managerId: managerId || null,
      steps,
      isManagerApprover: isManagerApprover || false,
      isSequence: isSequence !== undefined ? isSequence : true,
      minApprovalPercentage:
        minApprovalPercentage !== undefined ? minApprovalPercentage : 100,
      isActive: true,
      companyId
    });

    // Populate approvers
    await rule.populate("steps.approvers.userId", "name email role");
    await rule.populate("employeeId", "name email role managerId");
    await rule.populate("managerId", "name email role");

    return res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error("❌ Create rule error:", error);
    return res.status(500).json({ error: error.message || "Failed to create rule" });
  }
};

/**
 * Get all approval rules for company (Admin only)
 * GET /rules
 */
exports.getAllRules = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const rules = await ApprovalRule.find({ companyId })
      .populate("steps.approvers.userId", "name email role")
      .populate("employeeId", "name email role managerId")
      .populate("managerId", "name email role");

    return res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error("❌ Get all rules error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch rules" });
  }
};

/**
 * Update approval rule (Admin only)
 * PATCH /rules/:id
 * Body: { name?, category?, steps?, isManagerApprover?, isActive? }
 */
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      steps,
      isManagerApprover,
      isActive,
      employeeId,
      managerId,
      description,
      isSequence,
      minApprovalPercentage
    } = req.body;
    const companyId = req.user.companyId;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid rule ID" });
    }

    // Find rule in company
    const rule = await ApprovalRule.findOne({ _id: id, companyId });
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    if (employeeId !== undefined) {
      const employee = await User.findOne({
        _id: employeeId,
        companyId,
        role: "EMPLOYEE"
      });

      if (!employee) {
        return res.status(404).json({ error: "Employee not found in company" });
      }

      const duplicate = await ApprovalRule.findOne({
        _id: { $ne: id },
        companyId,
        employeeId,
        isActive: true
      });

      if (duplicate) {
        return res.status(400).json({ error: "An active rule already exists for this employee" });
      }

      rule.employeeId = employeeId;
    }

    if (managerId !== undefined) {
      if (managerId === null) {
        rule.managerId = null;
      } else {
        const manager = await User.findOne({
          _id: managerId,
          companyId,
          role: { $in: ["ADMIN", "MANAGER"] }
        });

        if (!manager) {
          return res.status(404).json({ error: "Manager not found in company" });
        }

        rule.managerId = managerId;
      }
    }

    // If updating steps, verify all approver IDs exist
    if (steps !== undefined) {
      const allApproverIds = [];
      for (const step of steps) {
        for (const approver of step.approvers) {
          allApproverIds.push(approver.userId);
        }
      }

      const approverUsers = await User.find({
        _id: { $in: allApproverIds },
        companyId
      });

      if (approverUsers.length !== allApproverIds.length) {
        return res.status(404).json({ error: "One or more approvers not found in company" });
      }

      rule.steps = steps;
    }

    // Update other fields
    if (name !== undefined) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (category !== undefined) rule.category = category;
    if (isManagerApprover !== undefined) rule.isManagerApprover = isManagerApprover;
    if (isSequence !== undefined) rule.isSequence = isSequence;
    if (minApprovalPercentage !== undefined) rule.minApprovalPercentage = minApprovalPercentage;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();
    await rule.populate("steps.approvers.userId", "name email role");
    await rule.populate("employeeId", "name email role managerId");
    await rule.populate("managerId", "name email role");

    return res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error("❌ Update rule error:", error);
    return res.status(500).json({ error: error.message || "Failed to update rule" });
  }
};

/**
 * Delete rule (soft delete via isActive flag)
 * DELETE /rules/:id
 */
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid rule ID" });
    }

    // Find rule in company
    const rule = await ApprovalRule.findOne({ _id: id, companyId });
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Soft delete: set isActive to false
    rule.isActive = false;
    await rule.save();

    return res.status(200).json({
      success: true,
      message: "Rule deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete rule error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete rule" });
  }
};
