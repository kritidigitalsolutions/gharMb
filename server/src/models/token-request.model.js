/**
 * Token Request Model
 * Handles property booking token requests submitted by prospective buyers / tenants to property owners,
 * including 5-step booking details (personal, family, occupation, ID proof upload, proposed token amount selection),
 * and owner decision workflow (accept / reject / cancel). No online payment is processed on the platform.
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

    // Step 4: Upload ID Proof (Aadhaar / PAN / Passport / Driving License / etc.)
    idProof: {
      idProofType: {
        type: String,
        default: 'Aadhaar',
        trim: true,
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
      default: 0,
    },
    isTokenApplicable: {
      type: Boolean,
      default: true,
    },
    isRental: {
      type: Boolean,
      default: true,
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

    // Token Request Status (pending -> contacted -> accepted / rejected / cancelled)
    status: {
      type: String,
      enum: ['pending', 'contacted', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Out-of-App Handling Tracking by Admin
    requestSource: {
      type: String,
      enum: ['one_click', 'form', 'admin_manual'],
      default: 'one_click',
      index: true,
    },
    handledByAdmin: {
      type: Boolean,
      default: true,
      index: true,
    },
    outOfAppStatus: {
      type: String,
      enum: ['pending_contact', 'contacted', 'token_received', 'deal_closed', 'rejected', 'cancelled'],
      default: 'pending_contact',
      index: true,
    },
    contactNotes: {
      type: String,
      trim: true,
    },
    lastContactedAt: {
      type: Date,
    },
    tokenReceivedAmount: {
      type: Number,
      default: 0,
    },
    tokenReceivedDate: {
      type: Date,
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
      currentCity: { type: String, trim: true },
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

// Auto-generate Token Request Tracker ID and sync contact details
tokenRequestSchema.pre('save', function () {
  if (!this.tokenRequestId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.tokenRequestId = `#TKN-${dateStr}-${randomNum}`;
  }
  // Sync clientDetails <-> personalDetails
  if (this.personalDetails && this.personalDetails.fullName) {
    this.clientDetails = {
      name: this.personalDetails.fullName,
      phone: this.personalDetails.mobileNumber,
      email: this.personalDetails.email,
      currentCity: this.personalDetails.currentCity || this.clientDetails?.currentCity || '',
    };
  } else if (this.clientDetails && this.clientDetails.name) {
    this.personalDetails = {
      fullName: this.clientDetails.name,
      mobileNumber: this.clientDetails.phone,
      email: this.clientDetails.email,
      currentCity: this.clientDetails.currentCity || '',
    };
  }
});

tokenRequestSchema.index({ owner: 1, status: 1 });
tokenRequestSchema.index({ client: 1, status: 1 });
tokenRequestSchema.index({ property: 1, status: 1 });

const TokenRequest = mongoose.model('TokenRequest', tokenRequestSchema);

module.exports = TokenRequest;
