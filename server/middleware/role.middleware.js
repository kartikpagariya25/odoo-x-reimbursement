/**
 * Check if User's role is in allowed roles list
 * Usage: router.get('/admin', roleMiddleware('ADMIN'), controller)
 *        router.get('/approve', roleMiddleware('MANAGER', 'ADMIN'), controller)
 * 
 * @param  {...string} allowedRoles - One or more role strings (ADMIN, MANAGER, EMPLOYEE)
 * @returns {Function} Express middleware
 */
exports.roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};
