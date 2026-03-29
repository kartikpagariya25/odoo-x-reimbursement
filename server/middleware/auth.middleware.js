const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_dont_use";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

const protect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authorized, invalid token payload" });
      }

      req.user = await User.findById(userId).select("-password").populate("companyId");
      if (!req.user) {
        return res.status(401).json({ error: "Not authorized, user missing" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ error: "Not authorized, no token provided" });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Role ${req.user?.role || "unknown"} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize, authMiddleware, generateToken };
