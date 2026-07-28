/**
 * GHARMB Server Entrypoint
 * This file boots the express application, connects to MongoDB,
 * and handles process-level events (unhandled exceptions, SIGTERM).
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const connectDB = require('./src/config/db');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5001;

// Start Server
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  GHARMB Backend Server Booted Successfully       `);
  console.log(`  Port: ${PORT}                                   `);
  console.log(`==================================================`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signals for clean deployments (Docker, AWS, PM2, Heroku)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down server gracefully...');
  server.close(() => {
    console.log('💥 Process terminated safely.');
  });
});
