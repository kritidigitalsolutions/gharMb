/**
 * Role-Based Access Control Middleware
 * Restricts access to specific roles. Example usage: restrictTo('admin', 'agent', 'builder')
 */

const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please authenticate before hitting this route.',
      });
    }

    // Determine role case-insensitively
    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => (r || '').toLowerCase());

    if (!normalizedAllowed.includes(userRole) && userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: Your account role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = restrictTo;
