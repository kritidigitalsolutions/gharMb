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

    // Determine role. Admins verified from Admin model will have role 'admin' implicitly or explicitly.
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: Your account role '${userRole}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = restrictTo;
