const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables reliably
dotenv.config({ path: path.join(__dirname, "../../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    const errorMsg = "MONGO_URI is not defined in environment variables. Please add MONGO_URI in your Vercel Project Settings.";
    console.error(`⚠️ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevent 10000ms buffering hang
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("MongoDB Connected Successfully");
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.error("MongoDB Connection Failed:", err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;
