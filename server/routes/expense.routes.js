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
  rejectExpense
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
router.get("/:id", authMiddleware, getExpenseDetail);

/**
 * Admin endpoints
 */
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllExpenses);
router.post(
  "/:id/override",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(validateOverride),
  overrideExpense
);

module.exports = router;