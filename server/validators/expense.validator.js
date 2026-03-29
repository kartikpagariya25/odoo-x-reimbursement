const mongoose = require("mongoose");

const validateCreateExpense = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { amount, currency, category, description, date } = payload;

  if (amount === undefined || amount === null || typeof amount !== "number" || amount < 0) {
    errors.push("amount must be a valid non-negative number");
  }

  if (!currency || typeof currency !== "string" || currency.length !== 3) {
    errors.push("currency is required and must be a 3-letter code (e.g., USD)");
  }

  if (!category || typeof category !== "string") {
    errors.push("category is required");
  }

  if (!description || typeof description !== "string") {
    errors.push("description is required");
  }

  if (!date || Number.isNaN(Date.parse(date))) {
    errors.push("date is required and must be a valid ISO string");
  }

  return { valid: errors.length === 0, errors };
};

const validateRejectExpense = (req) => {
  const errors = [];
  const payload = req.body || {};
  if (!payload.comment || typeof payload.comment !== "string" || payload.comment.trim() === "") {
    errors.push("comment is required to reject an expense");
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateCreateExpense, validateRejectExpense };
