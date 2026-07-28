const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for user/admin authentication
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The role of the user (e.g. 'buyer', 'agent', 'builder', 'admin')
 * @returns {string} - Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'gharmb_secret_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = generateToken;
