const validateRegisterCompany = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { name, email, password, companyName } = payload;

  if (!name || typeof name !== "string") errors.push("User name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  if (!companyName || typeof companyName !== "string") errors.push("companyName is required to register a workspace");

  return { valid: errors.length === 0, errors };
};

const validateCreateUser = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { name, email, password, role } = payload;

  if (!name || typeof name !== "string") errors.push("User name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  if (role && !["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) errors.push("Invalid role");

  return { valid: errors.length === 0, errors };
};

const validateLogin = (req) => {
  const errors = [];
  const payload = req.body || {};
  const { email, password } = payload;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!password) errors.push("Password is required");

  return { valid: errors.length === 0, errors };
};

module.exports = { validateRegisterCompany, validateCreateUser, validateLogin };
