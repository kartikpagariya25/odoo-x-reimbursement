const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const { ROLES } = require("../config/constants");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_dont_use", {
    expiresIn: "30d",
  });
};

// 1. Register a new company and its first ADMIN
exports.registerCompany = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "Email already registered" });

    let companyCurrency = req.body.currencyCode || "USD";
    let companyCountry = req.body.country || "USA";
    
    // We already validated name, email, password, companyName via validator
    const company = await Company.create({
      name: companyName,
      country: companyCountry,
      currencyCode: companyCurrency.toUpperCase()
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: ROLES.ADMIN,
      companyId: company._id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Admin creates a Manager or Employee in their company
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    const companyId = req.user.companyId;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists with this email" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || ROLES.EMPLOYEE,
      companyId,
      managerId: managerId || null
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("companyId", "name currencyCode");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
