const mongoose = require("mongoose");
const fs = require("fs");

const Expense = require("../models/Expense");
const User = require("../models/User");
const ApprovalRule = require("../models/ApprovalRule");
const { parseReceipt } = require("../services/ocr.service");

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