const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: false,
      minlength: 6,
    },

    firebaseUid: {
      type: String,
      default: null,
      index: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      default: "ADMIN",
    },

    permissions: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);