/**
 * Currency Service
 * Provides currency exchange rates and conversion
 * TODO: Integrate with real exchange rate API in production
 */

// Mock exchange rates (use real API in production)
const EXCHANGE_RATES = {
  USD: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    INR: 83.12,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    SEK: 10.50,
    NZD: 1.67,
    MXN: 17.05,
    SGD: 1.34,
    HKD: 7.81,
    NOK: 10.72
  }
};

/**
 * Get all supported currency rates relative to USD
 * @returns {Object} Exchange rates object
 */
exports.getSupportedRates = () => {
  return {
    success: true,
    baseCurrency: "USD",
    rates: EXCHANGE_RATES.USD,
    supportedCurrencies: Object.keys(EXCHANGE_RATES.USD)
  };
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., USD)
 * @param {string} toCurrency - Target currency code (e.g., EUR)
 * @returns {Object} { success, amount, fromCurrency, toCurrency, convertedAmount, rate }
 */
exports.convertCurrency = (amount, fromCurrency, toCurrency) => {
  try {
    // Validate inputs
    if (!amount || typeof amount !== "number" || amount < 0) {
      throw new Error("Invalid amount");
    }

    const from = (fromCurrency || "USD").toUpperCase();
    const to = (toCurrency || "USD").toUpperCase();

    // Check if currencies are supported
    if (!EXCHANGE_RATES.USD[from]) {
      throw new Error(`Unsupported source currency: ${from}`);
    }

    if (!EXCHANGE_RATES.USD[to]) {
      throw new Error(`Unsupported target currency: ${to}`);
    }

    // Same currency - no conversion
    if (from === to) {
      return {
        success: true,
        amount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount: amount,
        rate: 1
      };
    }

    // Convert: first to USD, then to target
    const rateToUSD = 1 / EXCHANGE_RATES.USD[from]; // Convert from source to USD
    const rateFromUSD = EXCHANGE_RATES.USD[to]; // Convert from USD to target
    const finalRate = rateToUSD * rateFromUSD;

    const convertedAmount = parseFloat((amount * finalRate).toFixed(2));

    return {
      success: true,
      amount,
      fromCurrency: from,
      toCurrency: to,
      convertedAmount,
      rate: parseFloat(finalRate.toFixed(4))
    };
  } catch (error) {
    console.error("❌ Currency conversion error:", error);
    throw error;
  }
};

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Object} { rate, fromCurrency, toCurrency }
 */
exports.getExchangeRate = (fromCurrency, toCurrency) => {
  try {
    const from = (fromCurrency || "USD").toUpperCase();
    const to = (toCurrency || "USD").toUpperCase();

    if (!EXCHANGE_RATES.USD[from] || !EXCHANGE_RATES.USD[to]) {
      throw new Error("Unsupported currency");
    }

    const rateToUSD = 1 / EXCHANGE_RATES.USD[from];
    const rateFromUSD = EXCHANGE_RATES.USD[to];
    const rate = parseFloat((rateToUSD * rateFromUSD).toFixed(4));

    return {
      success: true,
      rate,
      fromCurrency: from,
      toCurrency: to,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("❌ Error getting exchange rate:", error);
    throw error;
  }
};
