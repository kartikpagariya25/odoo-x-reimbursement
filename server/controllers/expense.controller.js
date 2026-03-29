const { parseReceipt } = require('../services/ocr.service');
const fs = require('fs');

/**
 * POST /api/expenses/scan
 * Accepts a receipt image, runs Groq Vision OCR,
 * returns structured JSON for the frontend to pre-fill the expense form.
 */
const scanReceipt = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const imagePath = req.file.path;

  try {
    const ocrResult = await parseReceipt(imagePath);

    // Clean up the uploaded file after processing (we don't store scan-only images)
    fs.unlink(imagePath, () => {});

    return res.status(200).json({
      success: true,
      data: {
        amount: ocrResult.amount,
        currency: ocrResult.currency,
        date: ocrResult.date,
        merchantName: ocrResult.merchantName,
        category: ocrResult.category,
        confidence: ocrResult.confidence,
        method: ocrResult.method,
        rawText: ocrResult.rawText,
      },
    });
  } catch (error) {
    // Clean up on error too
    fs.unlink(imagePath, () => {});
    console.error('OCR scan error:', error.message);
    return res.status(500).json({ error: 'Failed to process receipt. Please try a clearer image.' });
  }
};

module.exports = { scanReceipt };
