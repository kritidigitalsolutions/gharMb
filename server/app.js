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

const errorMiddleware = require('./src/middlewares/error.middleware');

// Root Route Handlers (Admin vs App)
const adminAuthRoutes = require('./src/routes/admin/auth.routes');
const adminDashboardRoutes = require('./src/routes/admin/dashboard.routes');
const adminUserRoutes = require('./src/routes/admin/user.routes');
const adminPropertyRoutes = require('./src/routes/admin/property.routes');
const adminProjectRoutes = require('./src/routes/admin/project.routes');
const adminNotificationRoutes = require('./src/routes/admin/notification.routes');
const adminLegalRoutes = require('./src/routes/admin/legal.routes');
const adminPageRoutes = require('./src/routes/admin/page.routes');
const adminNewsRoutes = require('./src/routes/admin/news.routes');

const appAuthRoutes = require('./src/routes/user/auth.routes');
const appUserRoutes = require('./src/routes/user/user.routes');
const appPropertyRoutes = require('./src/routes/user/property.routes');
const appProjectRoutes = require('./src/routes/user/project.routes');
const appUploadRoutes = require('./src/routes/user/upload.routes');
const appEnquiryRoutes = require('./src/routes/user/enquiry.routes');
const appFavoriteRoutes = require('./src/routes/user/favorite.routes');
const appNotificationRoutes = require('./src/routes/user/notification.routes');
const appLegalRoutes = require('./src/routes/user/legal.routes');
const appPageRoutes = require('./src/routes/user/page.routes');
const appNewsRoutes = require('./src/routes/user/news.routes');

const app = express();

// 1. Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

// 5. Serve Static Assets (Uploaded images & files locally) with Cross-Origin headers
const serveUploads = (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
};

app.use('/uploads', serveUploads, express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', serveUploads, express.static(path.join(__dirname, 'uploads')));


// this is for first time add new admin data
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/admin.model");
const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    name: "Super Admin",
    email: "admin@gmail.com",
    password: hashedPassword
  });

  console.log("Admin created");
};
createAdmin().catch(err => console.log("Admin already exists or error:", err.message));


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
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use('/api/admin/projects', adminProjectRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/legal', adminLegalRoutes);
app.use('/api/admin/pages', adminPageRoutes);
app.use('/api/admin/news', adminNewsRoutes);



// 9. all USER API Routers
app.use('/api/user/auth', appAuthRoutes);

app.use('/api/users', appUserRoutes);

app.use('/api/properties', appPropertyRoutes);

app.use('/api/projects', appProjectRoutes);

app.use('/api/user/upload', appUploadRoutes);

app.use('/api/users/enquiries', appEnquiryRoutes);

app.use('/api/favorites', appFavoriteRoutes);

// app.use('/api/notifications', appNotificationRoutes);

app.use('/api/legal', appLegalRoutes);
app.use('/api/pages', appPageRoutes);
app.use('/api/news', appNewsRoutes);

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
