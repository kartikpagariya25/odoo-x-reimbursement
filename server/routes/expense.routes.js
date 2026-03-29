const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/upload.middleware");
const { scanReceipt, createExpense, approveExpense, rejectExpense } = require("../controllers/expense.controller");
const { validate } = require("../middleware/validate.middleware");
const { validateCreateExpense, validateRejectExpense } = require("../validators/expense.validator");
const { protect, authorize } = require("../middleware/auth.middleware");

// routes
router.post("/scan", protect, upload.single("receipt"), scanReceipt);
router.post("/create", protect, validate(validateCreateExpense), createExpense);

// Approval actions (Require Manager or Admin)
router.post("/:id/approve", protect, authorize("ADMIN", "MANAGER"), approveExpense);
router.post("/:id/reject", protect, authorize("ADMIN", "MANAGER"), validate(validateRejectExpense), rejectExpense);

module.exports = router;