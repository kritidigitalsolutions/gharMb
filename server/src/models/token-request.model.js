/**
 * Token Request Model
 * Handles property booking token requests submitted by prospective buyers / tenants to property owners,
 * including 5-step booking details (personal, family, occupation, ID proof upload, token amount selection),
 * escrow tracking, and admin settlement status.
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
      required: false,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },

    // Step 1: Personal Details
    personalDetails: {
      fullName: { type: String, trim: true },
      mobileNumber: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      currentCity: { type: String, trim: true },
    },

    // Step 2: Family Details
    familyDetails: {
      numberOfFamilyMembers: { type: String, trim: true, default: '1' },
      adults: { type: String, trim: true, default: '1' },
      children: { type: String, trim: true, default: '0' },
      maritalStatus: { type: String, trim: true, default: 'Single' },
    },

    // Step 3: Occupation Details
    occupationDetails: {
      profession: { type: String, trim: true },
      companyName: { type: String, trim: true },
      monthlyIncome: { type: String, trim: true },
    },

    // Step 4: Upload ID Proof (Aadhaar / PAN / Passport / Driving License)
    idProof: {
      idProofType: {
        type: String,
        enum: ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Other'],
        default: 'Aadhaar',
      },
      documentUrl: { type: String, trim: true },
      documentOriginalName: { type: String, trim: true },
    },

    // Step 5: Token Amount & Pricing Reference
    monthlyRent: {
      type: Number,
      default: 0,
    },
    totalAgreedPrice: {
      type: String,
      trim: true,
    },
    tokenAmount: {
      type: Number,
      required: [true, 'Token amount is required.'],
      default: 2000,
    },
    adjustmentNote: {
      type: String,
      default: 'Token amount will be adjusted in security deposit or first month\'s rent',
    },

    // Payment plan selection: direct full payment vs installment plan
    paymentPlanType: {
      type: String,
      enum: ['full_payment', 'installment'],
      default: 'full_payment',
      index: true,
    },
    installmentPlan: {
      downPaymentAmount: { type: Number, default: 0 },
      numberOfInstallments: { type: Number, default: 0 },
      installmentFrequency: { type: String, default: 'Monthly' },
      installmentAmount: { type: Number, default: 0 },
      totalPayable: { type: Number, default: 0 },
      proposedTerms: { type: String, trim: true },
    },

    // Request & Escrow Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    escrowStatus: {
      type: String,
      enum: ['Escrow Held', 'Released', 'Refunded', 'Disputed'],
      default: 'Escrow Held',
      index: true,
    },
    escrowBank: {
      type: String,
      default: 'GHARMB Escrow Trust Node #9910',
    },
    utrRef: {
      type: String,
      trim: true,
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
    adminNotes: {
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
    payoutDate: {
      type: Date,
    },
    refundDate: {
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
  // Sync clientDetails if personalDetails are populated
  if (this.personalDetails && this.personalDetails.fullName) {
    this.clientDetails = {
      name: this.personalDetails.fullName,
      phone: this.personalDetails.mobileNumber,
      email: this.personalDetails.email,
    };
  }
});

tokenRequestSchema.index({ owner: 1, status: 1 });
tokenRequestSchema.index({ client: 1, status: 1 });
tokenRequestSchema.index({ property: 1, status: 1 });

const TokenRequest = mongoose.model('TokenRequest', tokenRequestSchema);

module.exports = TokenRequest;
