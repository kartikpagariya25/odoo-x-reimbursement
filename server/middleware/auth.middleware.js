const jwt = require("jsonwebtoken");

/**
 * Verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 * Attaches: req.user (decoded token payload) containing { userId, email, role, companyId }
 */
exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode { userId, email, role, companyId }
 * @returns {string} JWT token
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};
