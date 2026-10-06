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

    // FCM Device Tokens for Push Notifications
    fcmTokens: [
      {
        token: {
          type: String,
          required: true,
          trim: true,
        },
        deviceType: {
          type: String,
          enum: ['android', 'ios', 'web', 'unknown'],
          default: 'unknown',
        },
        deviceId: {
          type: String,
          default: null,
        },
        lastActiveAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

adminSchema.index({ "fcmTokens.token": 1 });

module.exports = mongoose.model("Admin", adminSchema);