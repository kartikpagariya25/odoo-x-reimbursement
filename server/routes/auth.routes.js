const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/auth.controller");
const { validateSignup, validateLogin } = require("../validators/auth.validator");
const { validate } = require("../middleware/validate.middleware");

/**
 * POST /auth/signup
 * Create new Company + Admin User
 * Public endpoint (no auth required)
 */
router.post("/signup", validate(validateSignup), signup);

/**
 * POST /auth/login
 * Verify email & password, return JWT token
 * Public endpoint (no auth required)
 */
router.post("/login", validate(validateLogin), login);

module.exports = router;
