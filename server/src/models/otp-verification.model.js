const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    phoneDigits: {
      type: String,
      index: true,
      trim: true,
    },
    otp: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete expired records with MongoDB TTL index
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
