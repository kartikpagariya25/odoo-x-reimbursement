const express = require("express");
const router = express.Router();

const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser
} = require("../controllers/user.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { validateCreateUser } = require("../validators/auth.validator");

/**
 * POST /users
 * Create new user (Admin only)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(validateCreateUser),
  createUser
);

/**
 * GET /users
 * Get all users in company (Admin only)
 */
router.get("/", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);

/**
 * PATCH /users/:id
 * Update user (Admin only)
 */
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateUser
);

/**
 * DELETE /users/:id
 * Delete user (Admin only)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteUser
);

module.exports = router;
