/**
 * Token Request Model
 * Handles property booking token requests submitted by prospective buyers / tenants to property owners,
 * including token amount, payment status, decision state (pending / accepted / rejected), and audit timestamps.
 */

const mongoose = require('mongoose');

const tokenRequestSchema = new mongoose.Schema(
  {
    tokenRequestId: {
      type: String,
      unique: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Token request must be linked to a property.'],
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Token request must be submitted by a client/user.'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Token request must have a property owner recipient.'],
      index: true,
    },
    tokenAmount: {
      type: Number,
      required: [true, 'Token amount is required.'],
      default: 21000,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'paid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'netbanking', 'card', 'cash', 'cheque', 'other'],
      default: 'upi',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters.'],
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    clientDetails: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    decisionDate: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate Token Request Tracker ID
tokenRequestSchema.pre('save', function () {
  if (!this.tokenRequestId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.tokenRequestId = `#TKN-${dateStr}-${randomNum}`;
  }
});

tokenRequestSchema.index({ owner: 1, status: 1 });
tokenRequestSchema.index({ client: 1, status: 1 });
tokenRequestSchema.index({ property: 1, status: 1 });

const TokenRequest = mongoose.model('TokenRequest', tokenRequestSchema);

module.exports = TokenRequest;
