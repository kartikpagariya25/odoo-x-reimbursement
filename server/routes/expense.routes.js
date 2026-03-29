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
  getTeamExpenses
} = require("../controllers/expense.controller");
const { validate } = require("../middleware/validate.middleware");
const {
  validateCreateExpense,
  validateSubmitExpense,
  validateOverride
} = require("../validators/expense.validator");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

/**
 * POST /expenses/scan
 * OCR upload - public receipt scanning
 */
router.post("/scan", upload.single("receipt"), scanReceipt);

/**
 * POST /expenses/create
 * Legacy endpoint - create expense (kept for backwards compatibility)
 */
router.post("/create", validate(validateCreateExpense), createExpense);

/**
 * POST /expenses
 * Submit expense (Employee - authenticated)
 * Matches to rule and builds approval chain
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("EMPLOYEE"),
  validate(validateSubmitExpense),
  submitExpense
);

/**
 * GET /expenses
 * Get my expenses (Employee - authenticated)
 */
router.get("/", authMiddleware, roleMiddleware("EMPLOYEE"), getMyExpenses);

/**
 * GET /expenses/:id
 * Get expense detail
 */
router.get("/:id", authMiddleware, getExpenseDetail);

/**
 * GET /expenses/all
 * Get all expenses (Admin only)
 */
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllExpenses);

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

module.exports = router;