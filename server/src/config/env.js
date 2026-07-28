/**
 * Environment Variables Centralized Configuration and Validation
 * Loads variables via dotenv and verifies crucial keys are present before starting.
 */

const dotenv = require('dotenv');
const path = require('path');

// Resolve the path to the root server/.env file
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const requiredVars = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
const missingVars = [];

requiredVars.forEach((variable) => {
  if (!process.env[variable]) {
    missingVars.push(variable);
  }
});

if (missingVars.length > 0) {
  console.error('==================================================');
  console.error('🔥 CRITICAL STARTUP ERROR: Config variables missing!');
  console.error(`Missing keys: ${missingVars.join(', ')}`);
  console.error('Ensure these are populated in server/.env');
  console.error('==================================================');
  throw new Error(`Fatal: Missing required environment configurations: ${missingVars.join(', ')}`);
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};
