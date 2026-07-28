/**
 * Global Error Handling Middleware
 * Catch-all for express errors to ensure a clean JSON API interface.
 */

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};
