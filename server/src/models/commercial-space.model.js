/**
 * Commercial Space Model
 * Dedicated schema for commercial property listings:
 * Shop / Retail, Office Space, Showroom, Warehouse, Co-working, Industrial Plot.
 */

const mongoose = require('mongoose');

const commercialSpaceSchema = new mongoose.Schema(
  {
    // Auto-generated submission tracker
    submissionId: {
      type: String,
      unique: true,
      index: true,
    },

    // Listing metadata
    listingAs: {
      type: String,
      enum: ['Owner', 'Agent / Broker', 'Developer / Builder'],
      default: 'Owner',
    },

    // ─── Step 1: Basic Details ────────────────────────────────────────────────
    spaceType: {
      type: String,
      required: [true, 'Commercial space type is required.'],
      enum: [
        'Shop / Retail',
        'Office Space',
        'Showroom',
        'Warehouse',
        'Co-working',
        'Industrial Plot',
        'Other',
      ],
      trim: true,
    },
    listingFor: {
      type: String,
      required: [true, 'Specify if listing is for Sale, Rent, or Lease.'],
      enum: ['Sale', 'Rent', 'Lease'],
    },
    title: {
      type: String,
      required: [true, 'Listing title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      trim: true,
    },

    // ─── Location ─────────────────────────────────────────────────────────────
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality / area is required.'],
      trim: true,
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required.'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required.'],
      trim: true,
    },

    // GeoJSON Point for proximity search
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8561, 19.2812],
      },
    },

    // ─── Step 2: Space Specifications ─────────────────────────────────────────
    carpetArea: {
      type: Number,
      required: [true, 'Carpet area in sqft is required.'],
    },
    builtUpArea: {
      type: Number,
    },
    floorNo: {
      type: String,
      trim: true,
    },
    totalFloors: {
      type: String,
      trim: true,
    },
    frontage: {
      type: Number, // Width of shop/showroom in feet
    },
    ceilingHeight: {
      type: String,
      enum: ['< 10 ft', '10–14 ft', '14–18 ft', '18+ ft'],
    },
    powerLoad: {
      type: Number, // kW
    },
    ageOfProperty: {
      type: String,
      enum: ['0–3 yrs', '3–7 yrs', '7–15 yrs', '15+ yrs'],
    },
    furnishing: {
      type: String,
      enum: ['Unfurnished', 'Semi-furnished', 'Fully-furnished'],
    },
    facingDirection: {
      type: String,
      enum: ['East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW'],
    },
    parking: {
      type: String,
      // 'None', '1 covered', '2 covered', 'Open', '1 reserved', '2+ reserved', 'Visitor'
      trim: true,
    },
    washrooms: {
      type: String,
      trim: true,
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    // ─── Rental / Lease Terms (for Rent / Lease listings) ────────────────────
    availableFrom: {
      type: String, // 'Immediate', 'Within 1 Month', 'Within 3 Months', 'Custom Date'
    },
    lockInPeriod: {
      type: String, // 'None', '6 months', '1 year', '2 years', '3 years', '4+ years'
    },
    noticePeriod: {
      type: String, // '15 days', '1 month', '2 months', '3 months'
    },
    camIncluded: {
      type: String,
      enum: ['Yes', 'No', 'Partially'],
    },
    rentEscalationPercentage: {
      type: Number, // e.g. 5 for 5% yearly increment
    },
    brokerageFree: {
      type: Boolean,
      default: false,
    },
    rentNegotiable: {
      type: Boolean,
      default: false,
    },

    // ─── Step 3: Media ────────────────────────────────────────────────────────
    images: [
      {
        type: String,
      },
    ],

    // ─── Step 4: Pricing ──────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Price or monthly rent is required.'],
    },
    pricePerSqft: {
      type: Number, // Computed or entered by owner
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    securityDepositDuration: {
      type: String, // '1 month', '2 months', '3 months', '6 months'
    },
    maintenanceCharges: {
      type: Number,
      default: 0,
    },
    maintenanceIncludedInRent: {
      type: Boolean,
      default: false,
    },
    brokerageFee: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },

    // ─── Installment / EMI Options (Toggle for Direct Full Payment vs Installments)
    allowInstallments: {
      type: Boolean,
      default: false,
      index: true,
    },
    installmentDetails: {
      downPaymentAmount: {
        type: Number,
        default: 0,
      },
      downPaymentPercentage: {
        type: Number,
        default: 0,
      },
      numberOfInstallments: {
        type: Number,
        default: 0,
      },
      installmentFrequency: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Bi-annual', 'Yearly', 'Milestone-based', 'Custom'],
        default: 'Monthly',
      },
      installmentAmount: {
        type: Number,
        default: 0,
      },
      interestRate: {
        type: Number,
        default: 0,
      },
      installmentDurationMonths: {
        type: Number,
        default: 0,
      },
      gracePeriodDays: {
        type: Number,
        default: 0,
      },
      termsAndConditions: {
        type: String,
        trim: true,
      },
      milestones: [
        {
          name: { type: String, trim: true },
          percentage: { type: Number },
          amount: { type: Number },
          dueDate: { type: Date },
          description: { type: String, trim: true },
        },
      ],
    },

    // ─── Documents ────────────────────────────────────────────────────────────
    propertyDocuments: {
      titleDeed: { type: String, trim: true },
      electricityBill: { type: String, trim: true },
      taxReceipt: { type: String, trim: true },
      khataExtract: { type: String, trim: true },
      otherDoc: { type: String, trim: true },
    },
    documents: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        docType: { type: String, trim: true },
      },
    ],

    // ─── Plan Tier ────────────────────────────────────────────────────────────
    listingTier: {
      type: String,
      enum: ['Standard', 'Featured', 'Premium'],
      default: 'Standard',
    },

    // ─── Ownership ────────────────────────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Commercial space listing must belong to a user.'],
    },

    // ─── Admin Moderation ─────────────────────────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ─── Performance Analytics ────────────────────────────────────────────────
    viewsCount: {
      type: Number,
      default: 0,
    },
    shortlistedCount: {
      type: Number,
      default: 0,
    },
    inquiriesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save: Auto-generate Submission ID ────────────────────────────────────
commercialSpaceSchema.pre('save', function () {
  if (!this.submissionId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.submissionId = `#GBM-COM-${dateStr}-${randomNum}`;
  }
});

// ─── Virtual: isVerified badge ────────────────────────────────────────────────
commercialSpaceSchema.virtual('isVerified').get(function () {
  return this.approvalStatus === 'approved';
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
commercialSpaceSchema.index({ spaceType: 1, listingFor: 1, isLive: 1 });
commercialSpaceSchema.index({ price: 1 });
commercialSpaceSchema.index({ location: '2dsphere' });
commercialSpaceSchema.index({ title: 'text', city: 'text', locality: 'text' });

const CommercialSpace = mongoose.model('CommercialSpace', commercialSpaceSchema);

module.exports = CommercialSpace;
