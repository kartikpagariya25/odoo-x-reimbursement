const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/upload.middleware");
const { scanReceipt, createExpense } = require("../controllers/expense.controller");
const { validate } = require("../middleware/validate.middleware");
const { validateCreateExpense } = require("../validators/expense.validator");

// routes
router.post("/scan", upload.single("receipt"), scanReceipt);
router.post("/create", validate(validateCreateExpense), createExpense);

module.exports = router;