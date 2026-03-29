const express = require("express");
const router = express.Router();

const {
  createRule,
  getAllRules,
  updateRule,
  deleteRule
} = require("../controllers/rule.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { validateCreateRule, validateUpdateRule } = require("../validators/rule.validator");

/**
 * POST /rules
 * Create approval rule (Admin only)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(validateCreateRule),
  createRule
);

/**
 * GET /rules
 * Get all approval rules (Admin only)
 */
router.get("/", authMiddleware, roleMiddleware("ADMIN"), getAllRules);

/**
 * PATCH /rules/:id
 * Update approval rule (Admin only)
 */
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(validateUpdateRule),
  updateRule
);

/**
 * DELETE /rules/:id
 * Delete approval rule (soft delete, Admin only)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteRule
);

module.exports = router;
