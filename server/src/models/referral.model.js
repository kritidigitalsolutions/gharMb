/**
 * Referral / Reference Network Model
 * Stores ambassador referrals, peer recommendations, channel partner deals,
 * commission reward eligibility, and payout settlement records.
 */

const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referralId: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    // Referrer (Ambassador / Advocate)
    referrerName: {
      type: String,
      required: [true, 'Referrer name is required.'],
      trim: true,
    },
    referrerPhone: {
      type: String,
      required: [true, 'Referrer phone number is required.'],
      trim: true,
    },
    referrerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    referrerRole: {
      type: String,
      trim: true,
      default: 'Resident Ambassador', // 'Resident Ambassador', 'Channel Partner', 'Existing Homeowner', 'Verified Agent'
    },
    referrerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    // Referee (Referred Buyer / Tenant)
    refereeName: {
      type: String,
      required: [true, 'Referee name is required.'],
      trim: true,
    },
    refereePhone: {
      type: String,
      required: [true, 'Referee phone number is required.'],
      trim: true,
    },
    refereeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    // Linked Property / Deal Details
    linkedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: false,
    },
    propertyTitle: {
      type: String,
      trim: true,
      default: 'Direct Listing Consultation',
    },
    dealValue: {
      type: String,
      trim: true,
      default: 'On Request',
    },

    // Financial Reward & Commission
    rewardAmount: {
      type: Number,
      default: 20000,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['Eligible for Payout', 'Paid', 'Deal In Progress', 'Pending Audit', 'Cancelled'],
      default: 'Deal In Progress',
      index: true,
    },
    payoutDate: {
      type: String,
      default: '',
    },
    payoutRefId: {
      type: String,
      trim: true,
      default: '',
    },
    payoutMethod: {
      type: String,
      trim: true,
      default: 'UPI',
    },

    // Payout Settlement Banking Information
    bankDetails: {
      type: String,
      trim: true,
      default: '',
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },

    // Administrative Notes & Audit Trail
    notes: {
      type: String,
      trim: true,
      default: 'Referral deal registered in GharMB Ambassador Network.',
    },
    status: {
      type: String,
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique referral ID and Referral Code before saving
referralSchema.pre('save', async function () {
  if (!this.referralId) {
    const timestampPart = Date.now().toString().slice(-6);
    this.referralId = `#REF-${timestampPart}`;
  }

  if (!this.referralCode) {
    const namePrefix = (this.referrerName || 'GHAR')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.referralCode = `${namePrefix}-${randomSuffix}`;
  }
});

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
