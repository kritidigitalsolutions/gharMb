/**
 * Coin Transaction Ledger Model
 * Tracks all GharMB coin credits, debits, bonuses, redemptions, and expirations.
 */

const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for coin transaction.'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type is required.'],
      index: true,
    },
    source: {
      type: String,
      enum: [
        'friend_listing_bonus', // Referrer got ₹250 because friend posted listing
        'signup_bonus',         // Referee got ₹250 for signing up + posting first listing
        'referral_bonus',       // General referral bonus
        'admin_adjustment',     // Admin manual credit or deduction
        'promo',                // Promotional campaign
        'redeem_listing',       // Used coins to boost or feature listing
        'redeem_feature',       // Used coins for premium features
        'expired',              // Expired after 6 months
      ],
      default: 'referral_bonus',
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'GharMB Coins',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      default: null,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months per terms
      index: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'expired', 'reversed'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

coinTransactionSchema.pre('save', function () {
  if (!this.transactionId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(100 + Math.random() * 900);
    this.transactionId = `TXN-COIN-${timestamp}${random}`;
  }
});

const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);

module.exports = CoinTransaction;
