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

const validateSubmitExpense = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { amount, category, currency, description } = payload;
  const numericAmount = Number(amount);

  if (amount === undefined || amount === null) {
    errors.push("amount is required");
  } else if (Number.isNaN(numericAmount) || numericAmount < 0) {
    errors.push("amount must be a non-negative number");
  }

  if (!category || typeof category !== "string") {
    errors.push("category is required");
  }

  if (currency !== undefined && (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency))) {
    errors.push("currency must be 3-letter uppercase code (e.g., USD)");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateOverride = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { action, reason } = payload;

  if (!action || !["APPROVED", "REJECTED"].includes(action)) {
    errors.push("action must be APPROVED or REJECTED");
  }

  if (reason !== undefined && typeof reason !== "string") {
    errors.push("reason must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateApprovalAction = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { comment } = payload;

  if (comment !== undefined && typeof comment !== "string") {
    errors.push("comment must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateExpense,
  validateRejectExpense,
  validateSubmitExpense,
  validateOverride,
  validateApprovalAction
};
