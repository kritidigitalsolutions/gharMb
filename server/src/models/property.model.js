/**
 * Property Model
 * Comprehensive Schema supporting 5-Step Residential & Commercial Listing Workflows,
 * Pricing, Specs, Rental terms, Submission IDs, and Admin Moderation.
 */

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    // Submission Tracker
    submissionId: {
      type: String,
      unique: true,
      index: true,
    },

    // Step 0: User Category
    listingAs: {
      type: String,
      enum: ['Owner', 'Agent / Broker', 'Developer / Builder'],
      default: 'Owner',
    },

    // Step 1: Basic Details
    category: {
      type: String,
      enum: ['Residential', 'Commercial'],
      required: [true, 'Property category (Residential/Commercial) is required.'],
      default: 'Residential',
    },
    listingFor: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease', 'PG'],
      required: [true, 'Specify if listing is for Sale, Rent, Lease, or PG.'],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required.'],
      // Apartment, Villa, House, Studio, Plot (Residential)
      // Shop / Retail, Office space, Showroom, Warehouse, Co-working, Industrial plot (Commercial)
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Property listing title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality/area is required.'],
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
    description: {
      type: String,
      trim: true,
    },

    // Step 2: Property Specs (Residential & Commercial)
    bedrooms: {
      type: String, // '1', '2', '3', '4+'
      default: '1',
    },
    bathrooms: {
      type: String, // '1', '2', '3', '4+'
      default: '1',
    },
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
    // Commercial Specs
    frontage: {
      type: Number, // Width of shop/office in feet
    },
    ceilingHeight: {
      type: String, // '< 10 ft', '10–14 ft', '14–18 ft', '18+ ft'
    },
    powerLoad: {
      type: Number, // kW
    },
    ageOfProperty: {
      type: String, // '0–3 yrs', '3–7 yrs', '7–15 yrs', '15+ yrs'
    },
    furnishing: {
      type: String, // 'Unfurnished', 'Semi-furnished', 'Fully-furnished'
    },
    facingDirection: {
      type: String, // 'East', 'West', 'North', 'South', 'NE', 'NW', 'SE', 'SW'
    },
    parking: {
      type: String, // 'None', '1 covered', '2 covered', 'Open', '1 reserved', '2+ reserved', 'Visitor'
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    // Rental Terms (If Rent/Lease/PG)
    preferredTenants: [
      {
        type: String, // 'Family', 'Bachelors', 'Working professionals', 'Female', 'Male', 'Anyone'
      },
    ],
    petsAllowed: {
      type: Boolean,
      default: false,
    },
    smokingAllowed: {
      type: Boolean,
      default: false,
    },
    noticePeriod: {
      type: String, // '15 days', '1 month', '2 months', '3 months'
    },
    lockInPeriod: {
      type: String, // 'None', '6 months', '1 year', '2 years', '3 years', '4+ years'
    },
    camIncluded: {
      type: String, // 'Yes', 'No', 'Partially'
    },
    rentEscalationPercentage: {
      type: Number, // e.g. 5 for 5% yearly
    },
    brokerageFree: {
      type: Boolean,
      default: false,
    },
    rentNegotiable: {
      type: Boolean,
      default: false,
    },
    availableFrom: {
      type: String, // 'Immediate', 'Within 1 Month', 'Within 3 Months', 'Custom Date'
    },

    // Step 3: Photos Upload
    images: [
      {
        type: String,
      },
    ],

    // Step 4: Pricing & Preferences
    price: {
      type: Number,
      required: [true, 'Property price or monthly rent is required.'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    securityDepositDuration: {
      type: String,
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

    // Buyer & Property Preferences
    vastuCompliant: {
      type: Boolean,
      default: false,
    },
    openToAllBuyers: {
      type: Boolean,
      default: true,
    },
    loanAssistanceNeeded: {
      type: Boolean,
      default: false,
    },

    // Plan Selection
    listingTier: {
      type: String,
      enum: ['Standard', 'Featured', 'Premium'],
      default: 'Standard',
    },

    // Map Coordinates (GeoJSON)
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

    // Owner / Creator Reference
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property listing must belong to a user.'],
    },

    // Moderation & Approval Status
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

    // Performance Analytics
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
    tokensCount: {
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

// Auto-generate Submission ID before saving
propertySchema.pre('save', function () {
  if (!this.submissionId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.submissionId = `#GBM-${dateStr}-${randomNum}`;
  }
});

// Indexes for fast searching & filtering
propertySchema.index({ category: 1, listingFor: 1, isLive: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ location: '2dsphere' });
propertySchema.index({ title: 'text', city: 'text', locality: 'text' });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
