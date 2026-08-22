const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("⚠️ MONGO_URI environment variable is missing.");
      return;
    }

    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB Connected Successfully");
  } catch(error) {
    console.error("DB Connection Error:", error.message);
  }
};

module.exports = connectDB;
