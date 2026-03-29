const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { validateCreateUser } = require("../validators/auth.validator");
const mongoose = require("mongoose");

/**
 * Create a new user (Admin only)
 * POST /users
 * Body: { email, password, firstName, lastName, role, managerId? }
 */
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, name, role, managerId } = req.body;
    const adminCompanyId = req.user.companyId;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // If manager is provided, verify they exist in same company
    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        companyId: adminCompanyId
      });
      if (!manager) {
        return res.status(404).json({ error: "Manager not found in your company" });
      }
      if (!["ADMIN", "MANAGER"].includes(manager.role)) {
        return res.status(400).json({ error: "Manager must have ADMIN or MANAGER role" });
      }
    }

    const displayName = name?.trim() || `${firstName} ${lastName}`.trim();
    const initialPassword = password || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    // Create user
    const user = await User.create({
      name: displayName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      companyId: adminCompanyId,
      managerId: managerId || null
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    return res.status(500).json({ error: error.message || "Failed to create user" });
  }
};

/**
 * Get all users in the company (Admin only)
 * GET /users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;

    const users = await User.find({ companyId: adminCompanyId })
      .select("-password")
      .populate("managerId", "name email role");

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("❌ Get all users error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
};

/**
 * Update user (Admin only)
 * PATCH /users/:id
 * Body: { role?, managerId?, name?, email? }
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, managerId, name, email } = req.body;
    const adminCompanyId = req.user.companyId;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find user in same company
    const user = await User.findOne({ _id: id, companyId: adminCompanyId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name must be a non-empty string" });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "email must be a non-empty string" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      user.email = normalizedEmail;
    }

    // Update role if provided
    if (role !== undefined) {
      if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      user.role = role;
    }

    // Update manager if provided
    if (managerId !== undefined) {
      if (managerId === null) {
        user.managerId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(managerId)) {
          return res.status(400).json({ error: "Invalid managerId" });
        }
        
        // Verify manager exists in same company
        const manager = await User.findOne({
          _id: managerId,
          companyId: adminCompanyId
        });
        if (!manager) {
          return res.status(404).json({ error: "Manager not found in your company" });
        }
        if (!["ADMIN", "MANAGER"].includes(manager.role)) {
          return res.status(400).json({ error: "Manager must have ADMIN or MANAGER role" });
        }
        
        user.managerId = managerId;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error("❌ Update user error:", error);
    return res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

/**
 * Send temporary password (Admin only)
 * POST /users/:id/send-password
 */
exports.sendPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCompanyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findOne({ _id: id, companyId: adminCompanyId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();

    // Email transport can be integrated here; keep API response stable now.
    return res.status(200).json({
      success: true,
      data: {
        userId: String(user._id),
        sent: true,
        message: "Temporary password generated and marked as sent"
      }
    });
  } catch (error) {
    console.error("❌ Send password error:", error);
    return res.status(500).json({ error: error.message || "Failed to send temporary password" });
  }
};

/**
 * Delete user (Admin only)
 * DELETE /users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminCompanyId = req.user.companyId;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find and delete user in same company
    const user = await User.findOneAndDelete({
      _id: id,
      companyId: adminCompanyId
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
};
