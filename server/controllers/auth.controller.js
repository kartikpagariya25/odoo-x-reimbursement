const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");
const { generateToken } = require("../middleware/auth.middleware");

/**
 * Signup: Create new Company + Admin User
 * POST /auth/signup
 * Body: { email, password, companyName, country?, currencyCode? }
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, companyName, country, currencyCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create Company
    const company = await Company.create({
      name: companyName,
      country: country || "Unknown",
      currencyCode: currencyCode || "USD"
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User
    const admin = await User.create({
      name: `${companyName} Admin`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "ADMIN",
      companyId: company._id,
      managerId: null
    });

    // Generate JWT token
    const token = generateToken({
      userId: admin._id,
      email: admin.email,
      role: admin.role,
      companyId: admin.companyId
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          companyId: admin.companyId
        },
        token,
        company: {
          id: company._id,
          name: company.name,
          country: company.country,
          currencyCode: company.currencyCode
        }
      }
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ error: error.message || "Signup failed" });
  }
};

/**
 * Login: Verify email & password, return JWT
 * POST /auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate("companyId");

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        token
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: error.message || "Login failed" });
  }
};
