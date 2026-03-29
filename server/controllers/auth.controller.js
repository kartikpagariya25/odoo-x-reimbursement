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
      userId: String(admin._id),
      email: admin.email,
      role: admin.role,
      companyId: String(admin.companyId)
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          companyId: String(admin.companyId)
        },
        token,
        company: {
          id: String(company._id),
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
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const company = await Company.findById(user.companyId);

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      companyId: String(user.companyId)
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: String(user.companyId)
        },
        token,
        company: company
          ? {
              id: String(company._id),
              name: company.name,
              country: company.country,
              currencyCode: company.currencyCode
            }
          : null
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: error.message || "Login failed" });
  }
};
