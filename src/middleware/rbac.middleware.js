const { UserRole } = require('../models/enums');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 403, code: 'FORBIDDEN', message: `Required role: ${roles.join(' or ')}` });
    }
    next();
  };
};

const requireAdmin = requireRole(UserRole.ADMIN);
const requireOrganizer = requireRole(UserRole.ORGANIZER, UserRole.ADMIN);

module.exports = { requireRole, requireAdmin, requireOrganizer };