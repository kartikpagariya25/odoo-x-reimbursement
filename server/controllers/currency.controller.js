const {
  getSupportedRates,
  convertCurrency,
  getExchangeRate
} = require("../services/currency.service");

/**
 * Get all supported currency rates
 * GET /currency/rates
 * Returns exchange rates for all supported currencies
 */
exports.getRates = (req, res) => {
  try {
    const rates = getSupportedRates();
    return res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error("❌ Get rates error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch rates" });
  }
};

/**
 * Convert currency amount
 * GET /currency/convert?from=USD&to=EUR&amount=100
 * Query params:
 *   - from: Source currency (default: USD)
 *   - to: Target currency (default: USD)
 *   - amount: Amount to convert (required)
 */
exports.convertCurrency = (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!amount) {
      return res.status(400).json({ error: "amount query parameter is required" });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ error: "amount must be a valid non-negative number" });
    }

    // Call service to convert
    const result = convertCurrency(numAmount, from, to);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("❌ Convert currency error:", error);
    return res.status(400).json({ error: error.message || "Conversion failed" });
  }
};

/**
 * Get exchange rate
 * GET /currency/rate?from=USD&to=EUR
 * Query params:
 *   - from: Source currency (default: USD)
 *   - to: Target currency (default: USD)
 */
exports.getExchangeRate = (req, res) => {
  try {
    const { from, to } = req.query;

    const result = getExchangeRate(from, to);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("❌ Get exchange rate error:", error);
    return res.status(400).json({ error: error.message || "Failed to fetch exchange rate" });
  }
};
