/**
 * Validate signup request: email, password, companyName, country, currencyCode
 * Creates both Company and Admin User
 */
exports.validateSignup = (req) => {
  const errors = [];
  const { email, password, companyName, country, currencyCode } = req.body;

  // Email validation
  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email format is invalid");
  }

  // Password validation
  if (!password || typeof password !== "string") {
    errors.push("password is required and must be a string");
  } else if (password.length < 6) {
    errors.push("password must be at least 6 characters");
  }

  // Company name validation
  if (!companyName || typeof companyName !== "string") {
    errors.push("companyName is required and must be a string");
  }

  // Country validation (optional but if provided, must be string)
  if (country !== undefined && typeof country !== "string") {
    errors.push("country must be a string");
  }

  // Currency code validation (optional but if provided, must be 3-letter uppercase)
  if (currencyCode !== undefined) {
    if (typeof currencyCode !== "string") {
      errors.push("currencyCode must be a string");
    } else if (!/^[A-Z]{3}$/.test(currencyCode)) {
      errors.push("currencyCode must be 3 uppercase letters (e.g., USD, EUR)");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate login request: email, password
 */
exports.validateLogin = (req) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email format is invalid");
  }

  if (!password || typeof password !== "string") {
    errors.push("password is required and must be a string");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate create user request for admin inline user management.
 * Supports either `name` or `firstName`+`lastName` and optional password.
 */
exports.validateCreateUser = (req) => {
  const errors = [];
  const { email, password, firstName, lastName, name, role, managerId } = req.body;
  const mongoose = require("mongoose");

  // Email validation
  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email format is invalid");
  }

  // Password validation (optional)
  if (password !== undefined) {
    if (typeof password !== "string") {
      errors.push("password must be a string");
    } else if (password.length < 6) {
      errors.push("password must be at least 6 characters");
    }
  }

  // Name validation
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      errors.push("name must be a non-empty string");
    }
  } else if (!firstName || !lastName || typeof firstName !== "string" || typeof lastName !== "string") {
    errors.push("Either name or firstName + lastName is required");
  }

  // Role validation
  if (!role || !["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
    errors.push("role must be one of: ADMIN, MANAGER, EMPLOYEE");
  }

  // Manager ID validation (optional)
  if (managerId !== undefined && managerId !== null) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      errors.push("managerId must be a valid ObjectId");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
