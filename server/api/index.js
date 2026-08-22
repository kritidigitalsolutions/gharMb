const app = require('../app');
const connectDB = require('../src/config/db');

// Connect database for serverless requests
connectDB().catch(console.error);

module.exports = app;
