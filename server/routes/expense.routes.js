const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload.middleware');
const { scanReceipt } = require('../controllers/expense.controller');

// POST /api/expenses/scan — OCR scan only, returns pre-fill data
// No auth required for now (will add once auth is built)
router.post('/scan', upload.single('receipt'), scanReceipt);

module.exports = router;
