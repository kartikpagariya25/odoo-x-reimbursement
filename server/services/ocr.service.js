//meta-llama/llama-4-scout-17b-16e-instruct from groq

const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const Tesseract = require('tesseract.js');
const { CATEGORY_KEYWORDS, CURRENCY_SYMBOLS, EXPENSE_CATEGORIES } = require('../config/constants');



const VALID_CATEGORIES = Object.values(EXPENSE_CATEGORIES);

/**
 * Main entry point — give it an image path, get back structured expense data.
 * This is the ONLY function other parts of the system need to call.
 *
 * @param {string} imagePath — Absolute or relative path to the receipt image
 * @returns {Promise<Object>} Parsed receipt data compatible with the Expense model
 */
async function parseReceipt(imagePath) {
  const resolvedPath = path.resolve(imagePath);

  // Verify file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Receipt image not found: ${resolvedPath}`);
  }

  // PRIMARY: Try Groq Vision AI
  try {
    const result = await analyzeWithGroqVision(resolvedPath);
    result.method = 'groq-vision';
    return result;
  } catch (error) {
    console.warn('Groq Vision failed, falling back to Tesseract:', error.message);
  }

  // FALLBACK: Tesseract OCR + local keyword parser
  try {
    const rawText = await extractTextWithTesseract(resolvedPath);
    const result = classifyLocally(rawText);
    result.method = 'tesseract-fallback';
    result.rawText = rawText;
    return result;
  } catch (error) {
    console.error('Both OCR methods failed:', error.message);
    throw new Error('Failed to process receipt. Please try a clearer image.');
  }
}



/**
 * Sends the receipt image directly to Groq's Vision model.
 * The AI reads the image visually.
 * Returns fully structured expense data in a single API call.
 *
 * @param {string} imagePath — Path to the receipt image
 * @returns {Promise<Object>}
 */
async function analyzeWithGroqVision(imagePath) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Detect MIME type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp',
    '.bmp': 'image/bmp', '.tiff': 'image/tiff', '.tif': 'image/tiff',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const groq = new Groq({ apiKey });
  const categoriesList = VALID_CATEGORIES.join(', ');

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: `You are an expert receipt analysis AI. Look at this receipt image carefully and extract the following structured data:

1. **amount**: The FINAL TOTAL amount on the receipt (after taxes, service charges, etc.). Look for "Total", "Grand Total", "Net Amount", "Bill Amount", "Amount Due". If no explicit total exists, sum all individual line item prices. Return ONLY the number.
2. **currency**: The ISO currency code (INR, USD, EUR, GBP, etc.). Detect from symbols (₹=INR, $=USD, €=EUR, £=GBP, Rs/Rs.=INR). If the receipt appears to be from India (Indian names, Indian food items, Indian phone numbers), default to "INR".
3. **date**: The transaction date in YYYY-MM-DD format.
4. **merchantName**: The business/restaurant/store name. This is usually printed prominently at the top. Give the clean, proper name.
5. **category**: Classify this receipt into exactly ONE of: ${categoriesList}.
   Use these rules:
   - Restaurant bills, food delivery, cafes, canteens → "Food"
   - Flight/train/bus tickets, travel bookings → "Travel"
   - Hotel/resort/hostel stays → "Accommodation"
   - Cab/taxi/auto/metro/ride-share → "Transport"
   - Petrol/diesel/CNG/gas stations → "Fuel"
   - Pens, paper, printer supplies, office furniture → "Office Supplies"
   - Software licenses, cloud services, SaaS subscriptions → "Software & Subscriptions"
   - Phone bills, internet, broadband, recharge → "Communication"
   - Hospital, pharmacy, clinic, doctor → "Medical"
   - Movies, concerts, events, theme parks → "Entertainment"
   - E-commerce orders, retail/mall shopping → "Shopping"
   - Repair, servicing, plumbing, electrical, AMC → "Maintenance"
   - If genuinely unclear → "Other"
6. **confidence**: A number between 0.0 and 1.0 indicating how confident you are about the category.
7. **rawText**: A plain text transcription of all readable text on the receipt, line by line.

RESPOND ONLY WITH VALID JSON (no markdown fences, no explanation):
{"amount": <number or null>, "currency": "<string or null>", "date": "<YYYY-MM-DD or null>", "merchantName": "<string or null>", "category": "<string>", "confidence": <number>, "rawText": "<string>"}`,
          },
        ],
      },
    ],
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: 0.1,
    max_tokens: 1000,
  });

  const responseText = chatCompletion.choices[0]?.message?.content?.trim();
  if (!responseText) throw new Error('Empty response from Groq Vision');

  // Parse JSON — strip markdown backticks if Groq adds them
  const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const parsed = JSON.parse(cleaned);

  // Validate and sanitize every field
  return {
    amount: typeof parsed.amount === 'number' && parsed.amount > 0 ? parsed.amount : null,
    currency: typeof parsed.currency === 'string' ? parsed.currency.toUpperCase() : null,
    date: typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
    merchantName: typeof parsed.merchantName === 'string' && parsed.merchantName.length > 0 ? parsed.merchantName.trim() : null,
    category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : EXPENSE_CATEGORIES.OTHER,
    confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5,
    rawText: typeof parsed.rawText === 'string' ? parsed.rawText : '',
  };
}


// FALLBACK: TESSERACT + LOCAL PARSER


async function extractTextWithTesseract(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
    logger: () => { },
  });
  return text || '';
}

function classifyLocally(text) {
  return {
    amount: parseAmount(text).value,
    currency: parseCurrency(text),
    date: parseDate(text),
    merchantName: parseMerchant(text),
    category: detectCategory(text).category,
    confidence: detectCategory(text).confidence,
    rawText: text,
  };
}


// LOCAL FIELD PARSERS

function parseAmount(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const decimalPattern = /[\d,]+\.\d{2}/g;

  const totalKeywords = [
    /grand\s*total/i, /total\s*(amount|due|payable|paid)?/i,
    /amount\s*(due|payable|paid)/i, /net\s*(amount|payable)/i,
    /balance\s*due/i, /you\s*paid/i, /bill\s*amount/i,
  ];
  const subtotalKeywords = [/sub\s*total/i, /subtotal/i];

  const extractFromLine = (line) => {
    const decimals = line.match(decimalPattern);
    if (decimals) {
      const val = parseFloat(decimals[decimals.length - 1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 10000000) return val;
    }
    const euroMatch = line.match(/(\d+),(\d{2})(?!\d)/);
    if (euroMatch) {
      const val = parseFloat(euroMatch[1] + '.' + euroMatch[2]);
      if (!isNaN(val) && val > 0 && val < 10000000) return val;
    }
    return null;
  };

  for (const keyword of totalKeywords) {
    for (const line of lines) {
      if (keyword.test(line)) {
        const val = extractFromLine(line);
        if (val) return { value: val, raw: line };
      }
    }
  }

  for (const keyword of subtotalKeywords) {
    for (const line of lines) {
      if (keyword.test(line)) {
        const val = extractFromLine(line);
        if (val) return { value: val, raw: line };
      }
    }
  }

  // Sum line-item prices when no total line exists
  const lineItemPrices = [];
  for (const line of lines) {
    if (/^(date|time|server|waiter|table|order|dine|invoice|bill no|receipt)/i.test(line)) continue;
    if (/^[#\-=_*&]{3,}/.test(line)) continue;
    const priceAtEnd = line.match(/(\d[\d,]*\.\d{2})\s*[\]\)]*\s*$/);
    if (priceAtEnd) {
      const val = parseFloat(priceAtEnd[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 100000) lineItemPrices.push(val);
      continue;
    }
    const euroAtEnd = line.match(/(\d+),(\d{2})\s*$/);
    if (euroAtEnd) {
      const val = parseFloat(euroAtEnd[1] + '.' + euroAtEnd[2]);
      if (!isNaN(val) && val > 0 && val < 100000) lineItemPrices.push(val);
    }
  }

  if (lineItemPrices.length >= 2) {
    const sum = Math.round(lineItemPrices.reduce((a, b) => a + b, 0) * 100) / 100;
    return { value: sum, raw: `Sum of ${lineItemPrices.length} items` };
  }

  const allDecimals = text.match(decimalPattern);
  if (allDecimals) {
    const parsed = allDecimals.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n) && n > 0 && n < 10000000);
    if (parsed.length > 0) return { value: Math.max(...parsed), raw: null };
  }

  return { value: null, raw: null };
}

function parseCurrency(text) {
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (symbol.length <= 1) {
      if (text.includes(symbol)) return code;
    } else {
      const regex = new RegExp(`\\b${escapeRegex(symbol)}\\b`, 'i');
      if (regex.test(text)) return code;
    }
  }
  return null;
}

function parseDate(text) {
  const patterns = [
    { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, parse: (m) => ({ year: m[1], month: m[2], day: m[3] }) },
    { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, parse: (m) => ({ year: m[3], month: m[2], day: m[1] }) },
    { regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, parse: (m) => ({ year: m[3], month: monthToNum(m[2]), day: m[1] }) },
    { regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i, parse: (m) => ({ year: m[3], month: monthToNum(m[1]), day: m[2] }) },
    { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{2})(?!\d)/, parse: (m) => { const yr = parseInt(m[3]) > 50 ? '19' + m[3] : '20' + m[3]; return { year: yr, month: m[2], day: m[1] }; } },
  ];
  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
      try {
        const { year, month, day } = p.parse(match);
        const y = parseInt(year), mo = parseInt(month), d = parseInt(day);
        if (y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
          const dateStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (!isNaN(new Date(dateStr).getTime())) return dateStr;
        }
      } catch { continue; }
    }
  }
  return null;
}

function parseMerchant(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const noise = [
    /^(tax|gst|cgst|sgst|igst|vat|tin|gstin|pan|fssai|invoice|bill|receipt|date|time|tel|ph|phone|fax|email|www|http)/i,
    /^\d+[/-]\d+/, /^[#\-=_*&]{3,}/, /^\d+\.\d{2}$/,
    /^(total|subtotal|sub total|grand total|amount|discount|change|cash|card)/i,
    /^(server|waiter|cashier|table|dine\s*in|take\s*away|take\s*out|delivery|order)/i,
    /^(qty|item|desc|sr\.?\s*no|s\.?\s*no|sl\.?\s*no)/i,
  ];
  let count = 0;
  for (const line of lines) {
    if (count >= 7) break;
    if (noise.some(p => p.test(line))) continue;
    if (line.length < 3 || line.length > 60) { count++; continue; }
    const alpha = (line.match(/[a-zA-Z]/g) || []).length;
    if (alpha < line.length * 0.4) { count++; continue; }
    return line.replace(/[^\w\s&'.,-]/g, '').replace(/\s+/g, ' ').trim();
  }
  return null;
}

function detectCategory(text) {
  const lowerText = text.toLowerCase();
  const scores = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let total = 0;
    for (const { keyword, weight } of keywords) {
      const regex = new RegExp(escapeRegex(keyword), 'gi');
      const matches = lowerText.match(regex);
      if (matches) total += weight + (matches.length - 1) * (weight * 0.5);
    }
    scores[category] = Math.round(total * 100) / 100;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0]?.[1] || 0;
  const topCat = sorted[0]?.[0] || EXPENSE_CATEGORIES.OTHER;
  const secondScore = sorted[1]?.[1] || 0;
  if (topScore < 3) return { category: EXPENSE_CATEGORIES.OTHER, confidence: 0, scores };
  const abs = Math.min(topScore / 30, 1);
  const rel = secondScore > 0 ? Math.min((topScore - secondScore) / topScore, 1) : 1;
  return { category: topCat, confidence: Math.round((abs * 0.6 + rel * 0.4) * 100) / 100, scores };
}


// UTILITIES

function monthToNum(str) {
  const m = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  return m[str.toLowerCase().substring(0, 3)] || 1;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// EXPORTS

module.exports = {
  parseReceipt,           // Main entry — used by expense controller
  analyzeWithGroqVision,  // Direct Groq Vision call
  classifyLocally,        // Offline fallback
  detectCategory,         // Standalone category scoring
};
