const mongoose = require("mongoose");

const validateRegisterCompany = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { name, email, password, companyName } = payload;

  if (!name || typeof name !== "string") {
    errors.push("User name is required");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (!companyName || typeof companyName !== "string") {
    errors.push("companyName is required to register a workspace");
  }

  return { valid: errors.length === 0, errors };
};

const validateSignup = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { email, password, companyName, country, currencyCode, name } = payload;

  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email format is invalid");
  }

  if (!password || typeof password !== "string") {
    errors.push("password is required and must be a string");
  } else if (password.length < 6) {
    errors.push("password must be at least 6 characters");
  }

  if (!companyName || typeof companyName !== "string") {
    errors.push("companyName is required and must be a string");
  }

  if (country !== undefined && typeof country !== "string") {
    errors.push("country must be a string");
  }

  if (currencyCode !== undefined) {
    if (typeof currencyCode !== "string") {
      errors.push("currencyCode must be a string");
    } else if (!/^[A-Z]{3}$/.test(currencyCode)) {
      errors.push("currencyCode must be 3 uppercase letters (e.g., USD, EUR)");
    }
  }

  if (name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }

  return { valid: errors.length === 0, errors };
};

const validateLogin = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { email, password } = payload;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (!password) {
    errors.push("Password is required");
  }

  return { valid: errors.length === 0, errors };
};

const validateCreateUser = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { name, email, password, role, firstName, lastName, managerId } = payload;

  if (!name || typeof name !== "string") {
    errors.push("User name is required");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (role && !["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
    errors.push("Invalid role");
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
  if (role && !["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
    errors.push("Invalid role");
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

module.exports = { validateRegisterCompany, validateSignup, validateLogin, validateCreateUser };

