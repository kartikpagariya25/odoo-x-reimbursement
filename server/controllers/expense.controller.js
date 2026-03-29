const mongoose = require("mongoose");
const fs = require("fs");

const Expense = require("../models/Expense");
const User = require("../models/User");
const ApprovalRule = require("../models/ApprovalRule");
const ApprovalAction = require("../models/ApprovalAction");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/email.service");
const { parseReceipt } = require("../services/ocr.service");
const { STATUS } = require("../config/constants");

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

    const expense = await Expense.create({
      employeeId: req.user._id,
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
      actorId: req.user._id,
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

    // Find if user is authorized approver in current step
    const currentStepDoc = expense.approvalChain.find(s => s.stepIndex === expense.currentStep);
    if (!currentStepDoc || currentStepDoc.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Current step is already processed or invalid" });
    }

    const approverDoc = currentStepDoc.approvers.find(a => a.userId.toString() === req.user._id.toString());
    if (!approverDoc || approverDoc.status !== STATUS.PENDING) {
      return res.status(403).json({ error: "Not authorized or already approved" });
    }

    // Update statuses
    approverDoc.status = STATUS.APPROVED;
    currentStepDoc.status = STATUS.APPROVED; // Assuming 1 person approval completes the step for now

    // Record Action
    await ApprovalAction.create({
      expenseId: expense._id,
      approverId: req.user._id,
      action: STATUS.APPROVED,
      stepIndex: expense.currentStep
    });

    await AuditLog.create({
      actorId: req.user._id,
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

    const currentStepDoc = expense.approvalChain.find(s => s.stepIndex === expense.currentStep);
    if (!currentStepDoc || currentStepDoc.status !== STATUS.PENDING) {
      return res.status(400).json({ error: "Current step is already processed or invalid" });
    }

    const approverDoc = currentStepDoc.approvers.find(a => a.userId.toString() === req.user._id.toString());
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
      approverId: req.user._id,
      action: STATUS.REJECTED,
      stepIndex: expense.currentStep,
      comment
    });

    await AuditLog.create({
      actorId: req.user._id,
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