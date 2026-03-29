const express = require("express");
const router = express.Router();

const {
  registerCompany,
  signup,
  createUser,
  login,
  getMe
} = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  validateRegisterCompany,
  validateSignup,
  validateCreateUser,
  validateLogin
} = require("../validators/auth.validator");

/**
 * Public routes
 */
router.post("/register-company", validate(validateRegisterCompany), registerCompany);
router.post("/signup", validate(validateSignup), signup);
router.post("/login", validate(validateLogin), login);

/**
 * Protected routes
 */
router.get("/me", protect, getMe);
router.post("/users", protect, authorize("ADMIN"), validate(validateCreateUser), createUser);

module.exports = router;
