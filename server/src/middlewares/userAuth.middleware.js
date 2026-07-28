const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * User Authentication Middleware
 * Verifies the JWT bearer token and sets req.user to the authenticated user.
 */
const userAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please provide a token.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gharmb_secret_key_2026');
      
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.',
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired token. Please log in again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = userAuth;
