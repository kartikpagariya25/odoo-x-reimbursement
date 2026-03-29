const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/upload.middleware");
const {
  scanReceipt,
  createExpense,
  submitExpense,
  getMyExpenses,
  getExpenseDetail,
  getAllExpenses,
  overrideExpense,
  approveExpense,
  rejectExpense,
  getExpenseAuditTrail,
  getTeamExpenses
} = require("../controllers/expense.controller");
const { validate } = require("../middleware/validate.middleware");
const {
  validateCreateExpense,
  validateSubmitExpense,
  validateOverride,
  validateRejectExpense
} = require("../validators/expense.validator");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

/**
 * OCR upload - receipt scanning
 */
router.post("/scan", upload.single("receipt"), scanReceipt);

/**
 * Legacy create expense endpoint
 */
router.post("/create", authMiddleware, validate(validateCreateExpense), createExpense);

/**
 * Approval endpoints
 */
router.post(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  approveExpense
);
router.post(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  validate(validateRejectExpense),
  rejectExpense
);

/**
 * Employee endpoints
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  validate(validateSubmitExpense),
  submitExpense
);
router.get("/", authMiddleware, roleMiddleware("EMPLOYEE"), getMyExpenses);
/**
 * GET /expenses/all
 * Get all expenses (Admin only)
 */
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllExpenses);

/**
 * GET /expenses/:id/audit
 * Get expense audit details (Admin only)
 */
router.get(
  "/:id/audit",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getExpenseAuditTrail
);

/**
 * POST /expenses/:id/override
 * Force approve/reject (Admin only)
 */
router.post(
  "/:id/override",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(validateOverride),
  overrideExpense
);

/**
 * GET /expenses/:id
 * Get expense detail
 */
router.get("/:id", authMiddleware, getExpenseDetail);

module.exports = router;