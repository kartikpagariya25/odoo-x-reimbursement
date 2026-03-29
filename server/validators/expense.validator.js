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

module.exports = { validateCreateExpense };
