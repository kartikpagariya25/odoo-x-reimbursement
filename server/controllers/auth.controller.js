const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");
const { ROLES } = require("../config/constants");
const { generateToken } = require("../middleware/auth.middleware");

const createJwtToken = (user) => {
  return generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  });
};

exports.registerCompany = async (req, res) => {
  try {
    const { name, email, password, companyName, country, currencyCode } = req.body;
    const normalizedEmail = email.toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const company = await Company.create({
      name: companyName,
      country: country || "USA",
      currencyCode: (currencyCode || "USD").toUpperCase()
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: ROLES.ADMIN,
      companyId: company._id
    });

    const token = createJwtToken(user);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId
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
    console.error("❌ Register company error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, companyName, country, currencyCode, name } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const company = await Company.create({
      name: companyName,
      country: country || "Unknown",
      currencyCode: (currencyCode || "USD").toUpperCase()
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: name || `${companyName} Admin`,
      email: normalizedEmail,
      password: hashedPassword,
      role: ROLES.ADMIN,
      companyId: company._id,
      managerId: null
    });

    const token = createJwtToken(admin);

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

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    const companyId = req.user.companyId;
    const normalizedEmail = email.toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || ROLES.EMPLOYEE,
      companyId,
      managerId: managerId || null
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        managerId: user.managerId
      }
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).populate("companyId");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createJwtToken(user);

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

exports.getMe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select("-password").populate("companyId", "name currencyCode");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return res.status(500).json({ error: error.message });
  }
};
