const express = require("express");
const router = express.Router();

const {
  approveExpense,
  rejectExpense,
  getPendingApprovals
} = require("../controllers/approval.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { validateApprovalAction } = require("../validators/expense.validator");

/**
 * POST /approval/expenses/:id/approve
 * Approve an expense at current step
 */
router.post(
  "/expenses/:id/approve",
  authMiddleware,
  validate(validateApprovalAction),
  approveExpense
);

/**
 * POST /approval/expenses/:id/reject
 * Reject an expense
 */
router.post(
  "/expenses/:id/reject",
  authMiddleware,
  validate(validateApprovalAction),
  rejectExpense
);

/**
 * GET /approval/expenses/pending
 * Get pending approvals for current user
 */
router.get("/expenses/pending", authMiddleware, getPendingApprovals);

module.exports = router;
