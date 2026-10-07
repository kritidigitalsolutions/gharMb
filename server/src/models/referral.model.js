/**
 * Referral / Reference Network Model
 * Stores both:
 * 1. "Refer & Earn" app program (₹250 GharMB coins for both referrer and referee when referee lists first property)
 * 2. Ambassador / Channel Partner offline deal recommendations and payout settlement records.
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

    // Program category
    programType: {
      type: String,
      enum: ['refer_and_earn', 'ambassador_deal'],
      default: 'refer_and_earn',
      index: true,
    },

    // Referrer (Ambassador / Advocate / Existing User)
    referrerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
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
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    // Referee (Referred Friend / Buyer / Tenant)
    refereeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
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

    // Refer & Earn Coin Milestone Details
    coinsRewarded: {
      type: Number,
      default: 250,
      min: 0,
    },
    refereeCoinsRewarded: {
      type: Number,
      default: 250,
      min: 0,
    },
    referralStatus: {
      type: String,
      enum: ['rewarded', 'pending_listing', 'listing_posted', 'expired', 'cancelled'],
      default: 'rewarded',
      index: true,
    },
    propertyListed: {
      type: Boolean,
      default: false,
    },
    rewardCreditedAt: {
      type: Date,
      default: null,
    },
    coinsExpiryDate: {
      type: Date,
      default: null,
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

    // Financial Reward & Commission (Settled out of app by Admin)
    rewardAmount: {
      type: Number,
      default: 250,
      min: 0,
    },
    claimedAmount: {
      type: Number,
      default: 250,
      min: 0,
    },
    claimStatus: {
      type: String,
      enum: ['unclaimed', 'claim_submitted', 'pending_admin_payout', 'paid', 'rejected'],
      default: 'pending_admin_payout',
      index: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimNotes: {
      type: String,
      trim: true,
      default: '',
    },
    payoutStatus: {
      type: String,
      enum: [
        'Pending Admin Contact',
        'Eligible for Payout',
        'Claim Submitted',
        'Pending Admin Payout',
        'Paid',
        'Deal In Progress',
        'Pending Audit',
        'Cancelled',
        'Rejected',
      ],
      default: 'Pending Admin Contact',
      index: true,
    },
    payoutDate: {
      type: String,
      default: '',
    },
    payoutRefId: {
      type: String,
      trim: true,
      default: '', // External UTR / Transaction No / Payment Receipt Ref
    },
    payoutMethod: {
      type: String,
      trim: true,
      default: 'UPI', // 'UPI', 'Bank Transfer', 'NEFT', 'IMPS', 'RTGS', 'Cash'
    },

    // Payout Settlement Banking Information (Out-of-app transfer details)
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
    adminSettlementNotes: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
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

// Auto-generate unique referral ID and Referral Code before saving if not present
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
    this.referralCode = `GHARMB-${namePrefix}${randomSuffix}`;
  }
});

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
