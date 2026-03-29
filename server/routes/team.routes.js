const express = require("express");
const router = express.Router();

const { getTeamExpenses } = require("../controllers/expense.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

/**
 * GET /team/expenses
 * Get team expenses (Manager only - views direct reports)
 */
router.get(
  "/expenses",
  authMiddleware,
  roleMiddleware("MANAGER"),
  getTeamExpenses
);

module.exports = router;
