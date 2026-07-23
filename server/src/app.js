/**
 * GHARMB Express Application Configuration
 * Set up middlewares, rate limiters, static folders, routing, and error handling.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorMiddleware = require('./middlewares/error.middleware');

// Root Route Handlers (Admin vs App)
const adminAuthRoutes = require('./routes/admin/auth.routes');
const adminDashboardRoutes = require('./routes/admin/dashboard.routes');
const adminUserRoutes = require('./routes/admin/user.routes');
const adminPropertyRoutes = require('./routes/admin/property.routes');
const adminNotificationRoutes = require('./routes/admin/notification.routes');

const appAuthRoutes = require('./routes/app/auth.routes');
const appUserRoutes = require('./routes/app/user.routes');
const appPropertyRoutes = require('./routes/app/property.routes');
const appEnquiryRoutes = require('./routes/app/enquiry.routes');
const appFavoriteRoutes = require('./routes/app/favorite.routes');
const appNotificationRoutes = require('./routes/app/notification.routes');

const app = express();

// 1. Security Middlewares
app.use(helmet());

// 2. CORS Policy Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Logger Middleware
app.use(morgan('dev'));

// 4. Request Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Serve Static Assets (e.g. uploaded images locally)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Global API Rate Limiter
const apiLimiter = rateLimit({
  max: 200, // Limit each IP to 200 requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    status: 'fail',
    message: 'Too many requests from this IP address, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 7. Base Health Checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'GHARMB Platform API is running smoothly.',
    timestamp: new Date()
  });
});

// 8. Mount Admin API Routers
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/users', adminUserRoutes);
app.use('/api/v1/admin/properties', adminPropertyRoutes);
app.use('/api/v1/admin/notifications', adminNotificationRoutes);

// 9. Mount App/Client API Routers
app.use('/api/v1/app/auth', appAuthRoutes);
app.use('/api/v1/app/users', appUserRoutes);
app.use('/api/v1/app/properties', appPropertyRoutes);
app.use('/api/v1/app/enquiries', appEnquiryRoutes);
app.use('/api/v1/app/favorites', appFavoriteRoutes);
app.use('/api/v1/app/notifications', appNotificationRoutes);

// 10. Fallback 404 Route handler
app.use((req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  err.statusCode = 404;
  err.status = 'fail';
  err.isOperational = true; // Mark as expected error
  next(err);
});

// 11. Error-Handling Middleware
app.use(errorMiddleware);

module.exports = app;
