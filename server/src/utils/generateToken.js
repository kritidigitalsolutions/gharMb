const jwt = require('jsonwebtoken');

/**
 * Access token configuration
 */
const getAccessSecret = () => process.env.JWT_SECRET || 'gharmb_secret_key_2026';
const getAccessExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

/**
 * Refresh token configuration
 */
const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET ||
  (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'gharmb_refresh_secret_key_2026');
const getRefreshExpiresIn = () => process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate a JWT Access Token for user/admin authentication
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The role of the user (e.g. 'buyer', 'agent', 'builder', 'admin')
 * @param {object} [options] - Additional custom payload options
 * @returns {string} - Signed JWT access token
 */
const generateToken = (id, role, options = {}) => {
  return jwt.sign(
    {
      id: id ? id.toString() : undefined,
      role: role || undefined,
      tokenType: 'access',
      ...options,
    },
    getAccessSecret(),
    {
      expiresIn: getAccessExpiresIn(),
    }
  );
};

/**
 * Alias for generateToken
 */
const generateAccessToken = generateToken;

/**
 * Generate a JWT Refresh Token for session renewal
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The role of the user
 * @param {object} [options] - Additional custom payload options
 * @returns {string} - Signed JWT refresh token
 */
const generateRefreshToken = (id, role, options = {}) => {
  return jwt.sign(
    {
      id: id ? id.toString() : undefined,
      role: role || undefined,
      tokenType: 'refresh',
      ...options,
    },
    getRefreshSecret(),
    {
      expiresIn: getRefreshExpiresIn(),
    }
  );
};

/**
 * Generate both Access Token and Refresh Token simultaneously
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The role of the user
 * @returns {{ token: string, accessToken: string, refreshToken: string }}
 */
const generateAuthTokens = (id, role) => {
  const token = generateToken(id, role);
  const refreshToken = generateRefreshToken(id, role);
  return {
    token,
    accessToken: token,
    refreshToken,
  };
};

/**
 * Verify a refresh token, supporting the refresh secret with fallback to access secret
 * @param {string} token - The refresh token string
 * @returns {object} - Decoded payload
 */
const verifyRefreshToken = (token) => {
  if (!token) throw new Error('Token is required');
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (err) {
    // If invalid signature, attempt fallback with main JWT_SECRET
    // for seamless backwards compatibility
    if (err.name === 'JsonWebTokenError' && err.message && err.message.includes('signature')) {
      return jwt.verify(token, getAccessSecret());
    }
    throw err;
  }
};

/**
 * Verify an access token
 * @param {string} token - The access token string
 * @returns {object} - Decoded payload
 */
const verifyAccessToken = (token) => {
  if (!token) throw new Error('Token is required');
  return jwt.verify(token, getAccessSecret());
};

// Attach helper functions to generateToken for flexible import styles
generateToken.generateToken = generateToken;
generateToken.generateAccessToken = generateAccessToken;
generateToken.generateRefreshToken = generateRefreshToken;
generateToken.generateAuthTokens = generateAuthTokens;
generateToken.verifyRefreshToken = verifyRefreshToken;
generateToken.verifyAccessToken = verifyAccessToken;

module.exports = generateToken;
