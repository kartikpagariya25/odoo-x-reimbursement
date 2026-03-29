const express = require("express");
const router = express.Router();

const {
	getRates,
	convertCurrency,
	getExchangeRate
} = require("../controllers/currency.controller");

/**
 * GET /currency/rates
 * Get all supported currency exchange rates
 * Public endpoint (no auth required)
 */
router.get("/rates", getRates);

/**
 * GET /currency/convert?from=USD&to=EUR&amount=100
 * Convert amount between currencies
 * Query params: from, to, amount
 * Public endpoint (no auth required)
 */
router.get("/convert", convertCurrency);

/**
 * GET /currency/rate?from=USD&to=EUR
 * Get exchange rate between two currencies
 * Query params: from, to
 * Public endpoint (no auth required)
 */
router.get("/rate", getExchangeRate);

module.exports = router;
