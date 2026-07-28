/**
 * MongoDB Mongoose Connection Helper
 * Manages connecting to MongoDB Atlas or local MongoDB using connection pools.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('MONGO_URI environment variable is missing!');
      process.exit(1);
    }

    // Set connection options
    const options = {
      autoIndex: true, // Auto-build indexes in development; might disable in high-write production
    };

    const conn = await mongoose.connect(mongoUri, options);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost. Attempting to reconnect...');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
