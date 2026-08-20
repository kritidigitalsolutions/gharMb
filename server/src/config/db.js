const mongoose = require("mongoose");
// const fixDuplicateIndexError = require("../utils/fixDuplicateIndex");

const connectDB = async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI); // 👈 debug

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Fix duplicate index errors on startup
    console.log("🔍 Checking and fixing indexes...");
    // await fixDuplicateIndexError();

  } catch(error) {
    console.error("DB Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
