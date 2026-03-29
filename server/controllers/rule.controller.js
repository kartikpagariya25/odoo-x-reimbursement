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
    const { name, category, steps, isManagerApprover } = req.body;
    const companyId = req.user.companyId;

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
      category,
      steps,
      isManagerApprover: isManagerApprover || false,
      isActive: true,
      companyId
    });

    // Populate approvers
    await rule.populate("steps.approvers.userId");

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
      .populate("steps.approvers.userId", "name email role");

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
    const { name, category, steps, isManagerApprover, isActive } = req.body;
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
    if (category !== undefined) rule.category = category;
    if (isManagerApprover !== undefined) rule.isManagerApprover = isManagerApprover;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();
    await rule.populate("steps.approvers.userId");

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
