/**
 * OCR Test Script
 * Usage:  node test-ocr.js <path-to-receipt-image>
 * Example: node test-ocr.js ./test-receipts/receipt1.jpg
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { parseReceipt } = require('./services/ocr.service');

const DIVIDER = '='.repeat(60);

async function main() {
  let imagePath = process.argv[2];

  if (!imagePath) {
    const testDir = path.join(__dirname, 'test-receipts');
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir).filter(f =>
        /\.(jpg|jpeg|png|bmp|webp|tiff?)$/i.test(f)
      );
      if (files.length > 0) {
        imagePath = path.join(testDir, files[0]);
        console.log('Auto-detected image: ' + files[0] + '\n');
      }
    }
  }

  if (!imagePath) {
    console.log('Usage: node test-ocr.js <path-to-receipt-image>');
    console.log('\nOr place images in server/test-receipts/ folder');
    process.exit(1);
  }

  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('File not found: ' + resolvedPath);
    process.exit(1);
  }

  console.log(DIVIDER);
  console.log('  OCR ENGINE - Receipt Scanner Test');
  console.log(DIVIDER);
  console.log('\nScanning: ' + path.basename(resolvedPath));
  console.log('Processing...\n');

  const startTime = Date.now();

  try {
    const result = await parseReceipt(resolvedPath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(DIVIDER);
    console.log('  PARSED RESULTS');
    console.log(DIVIDER);
    console.log('  Amount       : ' + (result.amount != null ? result.amount : 'Not detected'));
    console.log('  Currency     : ' + (result.currency || 'Not detected'));
    console.log('  Date         : ' + (result.date || 'Not detected'));
    console.log('  Merchant     : ' + (result.merchantName || 'Not detected'));
    console.log('  Category     : ' + result.category);
    console.log('  Confidence   : ' + (result.confidence * 100).toFixed(0) + '%');
    console.log('  Method       : ' + (result.method || 'unknown'));
    console.log('  Time Taken   : ' + elapsed + 's');
    console.log(DIVIDER);

    console.log('\n  JSON OUTPUT:');
    console.log('  ' + '-'.repeat(40));
    const jsonOutput = {
      amount: result.amount,
      currency: result.currency,
      date: result.date,
      merchantName: result.merchantName,
      category: result.category,
      confidence: result.confidence,
      method: result.method,
    };
    console.log(JSON.stringify(jsonOutput, null, 2));

    if (result.rawText) {
      console.log('\n' + DIVIDER);
      console.log('  RAW TEXT (from AI / OCR)');
      console.log(DIVIDER);
      console.log(result.rawText.substring(0, 500));
      if (result.rawText.length > 500) console.log('  ... (truncated)');
    }

    console.log(DIVIDER);
  } catch (err) {
    console.error('OCR Failed:', err.message);
    process.exit(1);
  }
}

main();
