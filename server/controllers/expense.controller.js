const mongoose = require("mongoose");
const fs = require("fs");

const Expense = require("../models/Expense");
const User = require("../models/User");
const ApprovalRule = require("../models/ApprovalRule");
const ApprovalAction = require("../models/ApprovalAction");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/email.service");
const { parseReceipt } = require("../services/ocr.service");
const { matchExpenseToRule, buildApprovalChain } = require("../services/rule.service");
const { STATUS } = require("../config/constants");


const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  if (mongoose.isValidObjectId(value)) {
    return String(value);
  }

  if (typeof value === "object" && value._id && mongoose.Types.ObjectId.isValid(value._id)) {
    return String(value._id);
  }

  return null;
};

exports.scanReceipt = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  const imagePath = req.file.path;

  try {
    const ocrResult = await parseReceipt(imagePath);

    fs.unlink(imagePath, () => {});

    return res.status(200).json({
      success: true,
      data: {
        amount: ocrResult.amount,
        currency: ocrResult.currency,
        date: ocrResult.date,
        merchantName: ocrResult.merchantName,
        category: ocrResult.category,
        confidence: ocrResult.confidence,
        method: ocrResult.method,
        rawText: ocrResult.rawText
      }
    });
  } catch (error) {
    fs.unlink(imagePath, () => {});
    return res.status(500).json({ error: "Failed to process receipt. Please try a clearer image." });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date, merchantName } = req.body;

    const company = await mongoose.model('Company').findById(req.user.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Mock 1:1 conversion for now
    const convertedAmount = amount; 
    const companyCurrency = company.currencyCode || "USD";

    // Build the approval chain from rules
    const rule = await ApprovalRule.findOne({ category, companyId: req.user.companyId });
    if (!rule) {
      return res.status(400).json({ error: `No approval rule found for category: ${category}` });
    }

    // Default to sequential mapping
    const approvalChain = rule.steps.map(step => ({
      stepIndex: step.stepIndex || 0,
      status: STATUS.PENDING,
      approvers: step.approvers.map(a => ({
        userId: a.userId,
        status: STATUS.PENDING
      }))
    }));

    if (approvalChain.length === 0) {
      return res.status(400).json({ error: "Approval rule has no valid steps" });
    }

    const userId = req.user._id || req.user.userId;
    const expense = await Expense.create({
      employeeId: userId,
      companyId: req.user.companyId,
      ruleId: rule._id,
      amount,
      currency,
      convertedAmount,
      companyCurrency,
      category,
      description,
      date,
      merchantName: merchantName || "-",
      status: STATUS.PENDING,
      currentStep: approvalChain[0].stepIndex,
      approvalChain
    });

    // Send email to first approver
    if (approvalChain[0].approvers.length > 0) {
      const firstApprover = await User.findById(approvalChain[0].approvers[0].userId);
      if (firstApprover) {
        emailService.sendApprovalRequestEmail(firstApprover, expense, req.user).catch(err => console.error("Email error:", err));
      }
    }

    await AuditLog.create({
      actorId: req.user._id || req.user.userId,
      companyId: req.user.companyId,
      action: "CREATED_EXPENSE",
      targetId: expense._id,
      details: { amount, currency, category }
    });

    res.status(201).json(expense);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Expense not found or not pending" });
    }

    const userId = req.user._id || req.user.userId;

    // Find if user is authorized approver in current step
    const currentStepDoc = expense.approvalChain.find(s => s.stepIndex === expense.currentStep);
    if (!currentStepDoc || currentStepDoc.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Current step is already processed or invalid" });
    }

    const approverDoc = currentStepDoc.approvers.find(a => String(a.userId) === String(userId));
    if (!approverDoc || approverDoc.status !== STATUS.PENDING) {
      return res.status(403).json({ error: "Not authorized or already approved" });
    }

    // Update statuses
    approverDoc.status = STATUS.APPROVED;
    currentStepDoc.status = STATUS.APPROVED; // Assuming 1 person approval completes the step for now

    // Record Action
    await ApprovalAction.create({
      expenseId: expense._id,
      approverId: userId,
      action: STATUS.APPROVED,
      stepIndex: expense.currentStep
    });

    await AuditLog.create({
      actorId: userId,
      companyId: req.user.companyId,
      action: "APPROVED_STEP",
      targetId: expense._id
    });

    // Progress Chain
    const currentIdx = expense.approvalChain.findIndex(s => s.stepIndex === expense.currentStep);
    const hasMoreSteps = currentIdx + 1 < expense.approvalChain.length;

    const employee = await User.findById(expense.employeeId);

    if (hasMoreSteps) {
      const nextStepDoc = expense.approvalChain[currentIdx + 1];
      expense.currentStep = nextStepDoc.stepIndex;
      await expense.save();

      const nextApprover = await User.findById(nextStepDoc.approvers[0].userId);
      const stepsRemaining = expense.approvalChain.length - (currentIdx + 1);

      emailService.sendStepApprovedEmail(employee, expense, req.user.name, stepsRemaining).catch(e => console.error(e));
      if (nextApprover) {
        emailService.sendForwardedEmail(nextApprover, expense, employee, req.user.name).catch(e => console.error(e));
      }
    } else {
      expense.status = STATUS.APPROVED;
      await expense.save();

      emailService.sendFullyApprovedEmail(employee, expense).catch(e => console.error(e));
    }

    res.json({ success: true, expense });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || expense.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Expense not found or not pending" });
    }

    const userId = req.user._id || req.user.userId;

    const currentStepDoc = expense.approvalChain.find(s => s.stepIndex === expense.currentStep);
    if (!currentStepDoc || currentStepDoc.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Current step is already processed or invalid" });
    }

    const approverDoc = currentStepDoc.approvers.find(a => String(a.userId) === String(userId));
    if (!approverDoc || approverDoc.status !== STATUS.PENDING) {
      return res.status(403).json({ error: "Not authorized or already processed" });
    }

    const comment = req.body.comment;

    // Fail everything
    approverDoc.status = STATUS.REJECTED;
    currentStepDoc.status = STATUS.REJECTED;
    expense.status = STATUS.REJECTED;

    await ApprovalAction.create({
      expenseId: expense._id,
      approverId: userId,
      action: STATUS.REJECTED,
      stepIndex: expense.currentStep,
      comment
    });

    await AuditLog.create({
      actorId: userId,
      companyId: req.user.companyId,
      action: "REJECTED_EXPENSE",
      targetId: expense._id,
      details: { comment }
    });

    await expense.save();

    const employee = await User.findById(expense.employeeId);
    emailService.sendRejectedEmail(employee, expense, req.user.name, comment).catch(e => console.error(e));

    res.json({ success: true, expense });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Submit expense (Employee submits their own expense)
 * POST /expenses
 * Authenticated endpoint - uses req.user.userId as employee
 * Matches expense to rule and builds approval chain
 */
exports.submitExpense = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const companyId = normalizeObjectId(req.user.companyId);
    const { amount, category, currency, description, merchantName, date } = req.body;

    if (!companyId) {
      return res.status(401).json({ error: "Invalid company in auth token" });
    }

    // Get employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (String(employee.companyId) !== companyId) {
      return res.status(403).json({ error: "Employee not in your company" });
    }

    // Match to rule
    const rule = await matchExpenseToRule(category, companyId, employeeId);
    if (!rule) {
      return res.status(400).json({ error: `No approval rule found for category: ${category}` });
    }

    // Build approval chain
    const approvalChain = await buildApprovalChain(rule, employeeId, companyId);

    // Create expense
    const expense = await Expense.create({
      employeeId: mongoose.Types.ObjectId.createFromHexString(employeeId),
      companyId: mongoose.Types.ObjectId.createFromHexString(companyId),
      ruleId: rule._id,
      amount,
      category,
      currency: currency || "USD",
      description: description || "",
      merchantName: merchantName || "",
      date: date || new Date(),
      approvalChain,
      currentStep: 0,
      status: "PENDING"
    });

    await expense.populate("employeeId", "name email");
    await expense.populate("ruleId", "name category");

    // Create audit log
    await AuditLog.create({
      actorId: employeeId,
      companyId,
      action: "EXPENSE_SUBMITTED",
      details: {
        expenseId: expense._id,
        amount,
        category
      }
    });

    return res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error("❌ Submit expense error:", error);
    return res.status(500).json({ error: error.message || "Failed to submit expense" });
  }
};

/**
 * Get my expenses (Employee views own expenses)
 * GET /expenses
 * Authenticated endpoint - filters by req.user.userId
 */
exports.getMyExpenses = async (req, res) => {
  try {
    const employeeId = req.user.userId;

    const expenses = await Expense.find({ employeeId })
      .populate("employeeId", "name email")
      .populate("ruleId", "name category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error("❌ Get my expenses error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch expenses" });
  }
};

/**
 * Get expense detail
 * GET /expenses/:id
 * Authenticated endpoint
 * Employee can only see own, admin can see all
 */
exports.getExpenseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const companyId = normalizeObjectId(req.user.companyId);

    if (!companyId) {
      return res.status(401).json({ error: "Invalid company in auth token" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findById(id)
      .populate("employeeId", "name email role")
      .populate("ruleId", "name category")
      .populate("approvalChain.approvers.userId", "name email role");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check access: employee can see own, admin can see all in company
    if (role === "EMPLOYEE" && !expense.employeeId._id.equals(userId)) {
      return res.status(403).json({ error: "Forbidden: Cannot view other employee's expenses" });
    }

    if (!expense.companyId.equals(companyId)) {
      return res.status(403).json({ error: "Forbidden: Expense not in your company" });
    }

    return res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error("❌ Get expense detail error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch expense" });
  }
};

/**
 * Get all expenses (Admin only)
 * GET /expenses/all
 * Admin views all expenses in company
 */
exports.getAllExpenses = async (req, res) => {
  try {
    const companyId = normalizeObjectId(req.user.companyId);
    const { search, category, status, from, to } = req.query;

    if (!companyId) {
      return res.status(401).json({ error: "Invalid company in auth token" });
    }

    const expenses = await Expense.find({ companyId })
      .populate("employeeId", "name email role")
      .populate("ruleId", "name category")
      .sort({ createdAt: -1 });

    const filtered = expenses.filter((expense) => {
      if (category && category !== "All" && category !== "ALL" && expense.category !== category) {
        return false;
      }

      if (status && status !== "All" && status !== "ALL" && expense.status !== status) {
        return false;
      }

      const createdAt = expense.date || expense.createdAt;
      if (from) {
        const fromDate = new Date(from);
        if (createdAt < fromDate) {
          return false;
        }
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        if (createdAt > toDate) {
          return false;
        }
      }

      if (search) {
        const haystack = [
          expense.employeeId?.name,
          expense.description,
          expense.merchantName,
          expense.category
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(String(search).toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    return res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    console.error("❌ Get all expenses error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch expenses" });
  }
};

/**
 * Override expense (Admin force approve/reject)
 * POST /expenses/:id/override
 * Admin only - bypass approval workflow
 */
exports.overrideExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const { userId, companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({ _id: id, companyId });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Set status to action (APPROVED or REJECTED)
    expense.status = action;

    // Mark all approval steps as completed
    if (expense.approvalChain) {
      for (const step of expense.approvalChain) {
        step.status = action;
        for (const approver of step.approvers) {
          approver.status = action;
        }
      }
    }

    await expense.save();

    // Create audit log
    await AuditLog.create({
      actorId: userId,
      companyId,
      action: `EXPENSE_${action}_OVERRIDE`,
      details: {
        expenseId: expense._id,
        reason: reason || "",
        amount: expense.amount
      }
    });

    return res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error("❌ Override expense error:", error);
    return res.status(500).json({ error: error.message || "Failed to override expense" });
  }
};

/**
 * Get team expenses (Manager views team members' expenses)
 * GET /team/expenses
 * Manager role - views only direct reports' expenses
 */
exports.getTeamExpenses = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const companyId = req.user.companyId;

    // Find all employees managed by this manager
    const teamMembers = await User.find({
      managerId,
      companyId
    });

    const teamMemberIds = teamMembers.map(m => m._id);

    // Get expenses for team members
    const expenses = await Expense.find({
      employeeId: { $in: teamMemberIds },
      companyId
    })
      .populate("employeeId", "name email role")
      .populate("ruleId", "name category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error("❌ Get team expenses error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch team expenses" });
  }
};

/**
 * Get expense audit trail (Admin only)
 * GET /expenses/:id/audit
 */
exports.getExpenseAuditTrail = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = normalizeObjectId(req.user.companyId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({ _id: id, companyId })
      .populate("employeeId", "name email role")
      .populate("approvalChain.approvers.userId", "name email role");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const [approvalActions, auditLogs] = await Promise.all([
      ApprovalAction.find({ expenseId: id })
        .populate("approverId", "name email role")
        .sort({ createdAt: 1 }),
      AuditLog.find({
        companyId,
        "details.expenseId": id
      })
        .populate("actorId", "name email role")
        .sort({ createdAt: 1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        expense,
        approvalActions,
        auditLogs
      }
    });
  } catch (error) {
    console.error("❌ Get expense audit trail error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch expense audit trail" });
  }
};