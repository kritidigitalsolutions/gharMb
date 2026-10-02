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

const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const connectDB = require('./src/config/db');
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
const adminBlogRoutes = require('./src/routes/admin/blog.routes');
const adminBlogCategoryRoutes = require('./src/routes/admin/blog-category.routes');
const adminFaqRoutes = require('./src/routes/admin/faq.routes');
const adminFaqCategoryRoutes = require('./src/routes/admin/faq-category.routes');
const adminTestimonialRoutes = require('./src/routes/admin/testimonial.routes');
const adminWebInquiryRoutes = require('./src/routes/admin/web-inquiry.routes');
const adminCommercialSpaceRoutes = require('./src/routes/admin/commercial-space.routes');
const adminBannerRoutes = require('./src/routes/admin/banner.routes');

const appAuthRoutes = require('./src/routes/user/auth.routes');
const appUserRoutes = require('./src/routes/user/user.routes');
const appPropertyRoutes = require('./src/routes/user/property.routes');
const appProjectRoutes = require('./src/routes/user/project.routes');
const appUploadRoutes = require('./src/routes/user/upload.routes');
const appEnquiryRoutes = require('./src/routes/user/enquiry.routes');
const appFavoriteRoutes = require('./src/routes/user/favorite.routes');
const appNotificationRoutes = require('./src/routes/user/notification.routes');
const appDeveloperRoutes = require('./src/routes/user/developer.routes');
const appReviewRoutes = require('./src/routes/user/review.routes');
const appLegalRoutes = require('./src/routes/user/legal.routes');
const appPageRoutes = require('./src/routes/user/page.routes');
const appNewsRoutes = require('./src/routes/user/news.routes');
const appBlogRoutes = require('./src/routes/user/blog.routes');
const appFaqRoutes = require('./src/routes/user/faq.routes');
const appWebInquiryRoutes = require('./src/routes/user/web-inquiry.routes');
const appTestimonialRoutes = require('./src/routes/user/testimonial.routes');
const appCommercialSpaceRoutes = require('./src/routes/user/commercial-space.routes');
const appBannerRoutes = require('./src/routes/user/banner.routes');
const appTokenRequestRoutes = require('./src/routes/user/token-request.routes');

const app = express();

// 1. Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS Policy Configuration with Comprehensive Allowed Origins
const allowedOrigins = [
  'https://gharmb.com',
  'https://www.gharmb.com',
  'https://admin.gharmb.com',
  'https://server.gharmb.com',
  'http://gharmb.com',
  'http://www.gharmb.com',
  'http://admin.gharmb.com',
  'http://server.gharmb.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5001',
  'https://gharmb-web.vercel.app',
  'https://ghar-mb-226x.vercel.app',
  'https://frontend-ghar-mb.vercel.app',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow non-browser requests (mobile apps, React Native, Flutter, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // 2. Allow all gharmb.com subdomains and root domain (admin.gharmb.com, server.gharmb.com, gharmb.com, www.gharmb.com, etc.)
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*gharmb\.com(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // 3. Allow localhost and local network IP addresses for development (any port)
    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // 4. Allow all vercel preview & production domains (*.vercel.app)
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // 5. Allow mobile app custom schemes & webview origins
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://') || origin === 'null') {
      return callback(null, true);
    }

    // 6. Check explicit allowed origins list or wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Reject disallowed origins cleanly without crashing Express
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'x-auth-token',
    'x-client-platform',
    'platform'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours preflight caching
};

app.use(cors(corsOptions));

// 3. Logger Middleware
app.use(morgan('dev'));

// 4. Request Body Parsers (Increased to 50mb to support rich articles, base64 images & documents)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Serve Static Assets (Uploaded images & files locally) with Cross-Origin headers
const serveUploads = (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
};

app.use('/uploads', serveUploads, express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', serveUploads, express.static(path.join(__dirname, 'uploads')));

// 6. Database Connection Middleware (Awaits connection for serverless requests)
app.use(async (req, res, next) => {
  // Skip DB connection for static files and simple health checks
  if (req.path === '/' || req.path === '/health' || req.path.startsWith('/uploads') || req.path === '/favicon.ico' || req.path === '/favicon.png') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure:", err.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: `Database Connection Failed: ${err.message}. Please verify MONGO_URI in Vercel environment variables and ensure MongoDB Atlas Network Access has IP 0.0.0.0/0 allowed.`
    });
  }
});

// 7. Safe Admin Seeding (executed only when DB is connected)
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/admin.model");
let isSeedingAdmin = false;
const initAdmin = async () => {
  if (isSeedingAdmin) return;
  isSeedingAdmin = true;
  try {
    await connectDB();
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await Admin.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: hashedPassword
      });
      console.log("Super Admin seeded successfully");
    }
  } catch (err) {
    console.log("Admin initialization note:", err.message);
  }
};
initAdmin().catch(() => {});


// 6. Global API Rate Limiter
const apiLimiter = rateLimit({
  max: Number(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 1000 : 10000), // Generous limit in dev, configurable in prod
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    status: 'fail',
    message: 'Too many requests from this IP address, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development or for localhost requests
    if (process.env.NODE_ENV !== 'production') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost') return true;
    // Skip rate limiting for authenticated admin endpoints
    if (req.path.startsWith('/admin')) return true;
    return false;
  }
});
app.use('/api', apiLimiter);

// 7. Base Health Checks & Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'GHARMB Platform API is running smoothly.',
    health: '/health',
    timestamp: new Date()
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

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
app.use('/api/admin/blogs', adminBlogRoutes);
app.use('/api/admin/blog-categories', adminBlogCategoryRoutes);
app.use('/api/admin/faqs', adminFaqRoutes);
app.use('/api/admin/faq-categories', adminFaqCategoryRoutes);
app.use('/api/admin/testimonials', adminTestimonialRoutes);
app.use('/api/admin/web-inquiries', adminWebInquiryRoutes);
app.use('/api/admin/commercial-spaces', adminCommercialSpaceRoutes);
app.use('/api/admin/banners', adminBannerRoutes);



// 9. all USER API Routers
app.use('/api/user/auth', appAuthRoutes);
app.use('/api/auth', appAuthRoutes);

app.use('/api/users', appUserRoutes);
app.use('/api/user/users', appUserRoutes); // Supports $baseUrl/user/users/register-agent & register-developer

app.use('/api/properties', appPropertyRoutes);
app.use('/api/user/properties', appPropertyRoutes); // Supports $baseUrl/user/properties

app.use('/api/projects', appProjectRoutes);
app.use('/api/user/projects', appProjectRoutes);

app.use('/api/developers', appDeveloperRoutes); // Supports $baseUrl/developers/$id
app.use('/api/user/developers', appDeveloperRoutes);

app.use('/api/upload', appUploadRoutes);
app.use('/api/user/upload', appUploadRoutes); // Supports $baseUrl/user/upload/multiple

app.use('/api/users/enquiries', appEnquiryRoutes);

// Wishlist & Favorites (Supports both /wishlist and /favorites conventions)
app.use('/api/favorites', appFavoriteRoutes);
app.use('/api/user/favorites', appFavoriteRoutes);
app.use('/api/wishlist', appFavoriteRoutes);
app.use('/api/user/wishlist', appFavoriteRoutes);

// Developer & Builder Reviews
app.use('/api/reviews', appReviewRoutes);
app.use('/api/user/reviews', appReviewRoutes);
app.use('/api/developer-reviews', appReviewRoutes);

app.use('/api/notifications', appNotificationRoutes); // Notifications enabled
app.use('/api/user/notifications', appNotificationRoutes);

app.use('/api/legal', appLegalRoutes);
app.use('/api/pages', appPageRoutes);
app.use('/api/news', appNewsRoutes);
app.use('/api/blogs', appBlogRoutes);
app.use('/api/faqs', appFaqRoutes);
app.use('/api/testimonials', appTestimonialRoutes);
app.use('/api/web-inquiries', appWebInquiryRoutes);

app.use('/api/commercial-spaces', appCommercialSpaceRoutes);
app.use('/api/user/commercial-spaces', appCommercialSpaceRoutes);

// Home & Promotional Banners
app.use('/api/banners', appBannerRoutes);
app.use('/api/user/banners', appBannerRoutes);

// Property Token Booking Requests
app.use('/api/token-requests', appTokenRequestRoutes);
app.use('/api/user/token-requests', appTokenRequestRoutes);
app.use('/api/user/properties/token-requests', appTokenRequestRoutes);

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
