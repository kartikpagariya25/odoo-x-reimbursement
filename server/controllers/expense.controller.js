const mongoose = require("mongoose");
const fs = require("fs");

const Expense = require("../models/Expense");
const User = require("../models/User");
const ApprovalRule = require("../models/ApprovalRule");
const AuditLog = require("../models/AuditLog");
const { parseReceipt } = require("../services/ocr.service");
const { matchExpenseToRule, buildApprovalChain } = require("../services/rule.service");

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

    // Clean up the uploaded file after processing.
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
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Request body is required" });
    }

    const { employeeId, amount, category } = req.body;

    if (!employeeId || amount === undefined || !category) {
      return res.status(400).json({
        error: "employeeId, amount, and category are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: "Invalid employeeId format" });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (!employee.companyId) {
      return res.status(400).json({ error: "Employee has no company assigned" });
    }

    const rule = await ApprovalRule.findOne({
      category,
      companyId: employee.companyId
    });

    if (!rule) {
      return res.status(400).json({ error: "No rule found" });
    }

    const expense = await Expense.create({
      employeeId,
      companyId: employee.companyId,
      ruleId: rule._id,
      amount,
      category,
      status: "PENDING"
    });

    res.status(201).json(expense);

  } catch (err) {
    if (err.name === "CastError" || err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

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