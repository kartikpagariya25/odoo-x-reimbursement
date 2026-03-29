const mongoose = require("mongoose");

const validateCreateExpense = (req) => {
	const errors = [];
	const payload = req.body || {};
	const { employeeId, amount, category } = payload;

	if (!employeeId) {
		errors.push("employeeId is required");
	} else if (!mongoose.Types.ObjectId.isValid(employeeId)) {
		errors.push("employeeId must be a valid ObjectId");
	}

	if (amount === undefined || amount === null) {
		errors.push("amount is required");
	} else if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
		errors.push("amount must be a non-negative number");
	}

	if (!category || typeof category !== "string") {
		errors.push("category is required");
	}

	return {
		valid: errors.length === 0,
		errors
	};
};

/**
 * Validate submit expense request
 * Similar to createExpense but called by employee for their own expenses
 */
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

/**
 * Validate override (force approve/reject) request
 */
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

/**
 * Validate approval action (approve/reject)
 */
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
	validateSubmitExpense,
	validateOverride,
	validateApprovalAction
};
