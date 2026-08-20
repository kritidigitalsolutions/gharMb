/**
 * Authentication Middleware
 * Handles MERN JWT token verification and populates req.user.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Lazily load models to avoid circular dependencies during initialization
const getUserModel = () => mongoose.model('User');
const getAdminModel = () => mongoose.model('Admin');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract Bearer Token from HTTP Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please provide a valid token.',
      });
    }

    // 2. Verify Token
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key';
      const decoded = jwt.verify(token, secret);
      
      let user = null;
      const roleStr = (decoded.role || '').toLowerCase();

      if (roleStr === 'admin' || roleStr === 'superadmin' || roleStr === 'super_admin') {
        const Admin = getAdminModel();
        user = await Admin.findById(decoded.id).select('+password');
      } else {
        const User = getUserModel();
        user = await User.findById(decoded.id);
      }

      // Fallback: If not found in primary collection, check Admin model
      if (!user) {
        const Admin = getAdminModel();
        user = await Admin.findById(decoded.id);
      }

      // Fallback 2: Check User model
      if (!user) {
        const User = getUserModel();
        user = await User.findById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.',
        });
      }

      if (user.status === 'Blocked' || user.isActive === false) {
        return res.status(403).json({
          status: 'fail',
          message: 'Your account has been suspended or deactivated.',
        });
      }

      req.user = user;
      return next();

    } catch (jwtError) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired credentials. Please log in again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = protect;
