/**
 * Developer Project Model
 * Comprehensive Schema supporting Developer 5-Step New Launch / Under Construction Project Uploads,
 * Highlights, BHK Configurations, Amenities, Nearby Landmarks, Master Plans, Floor Plans, and Admin Moderation.
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // Submission Tracker
    submissionId: {
      type: String,
      unique: true,
      index: true,
    },

    // Developer Reference
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a registered developer.'],
    },

    // Step 1: Basic Info
    projectName: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
    },
    developerName: {
      type: String,
      required: [true, 'Developer / Builder name is required.'],
      trim: true,
    },
    reraProjectNumber: {
      type: String,
      required: [true, 'RERA project registration number is required.'],
      trim: true,
    },
    reraExpiryDate: {
      type: String, // DD/MM/YYYY or ISO Date
      trim: true,
    },
    launchDate: {
      type: String,
      trim: true,
    },
    projectType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Mixed use'],
      default: 'Residential',
    },
    projectStatus: {
      type: String,
      enum: ['Under construction', 'Ready to move', 'New launch'],
      default: 'Under construction',
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality is required.'],
      trim: true,
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address or pin location is required.'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required.'],
      trim: true,
    },
    possessionDate: {
      type: String, // e.g. "Dec 2026"
      trim: true,
    },
    projectWebsite: {
      type: String,
      trim: true,
    },
    projectTagline: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },

    // Step 2: BHK & Pricing (Project Highlights & Configurations)
    totalUnits: {
      type: Number,
      default: 0,
    },
    openSpacePercentage: {
      type: Number, // e.g. 70
      default: 0,
    },
    floors: {
      type: String, // e.g. "G + 14"
      trim: true,
    },
    towers: {
      type: Number,
      default: 1,
    },

    // BHK Configurations list (Multiple configurations: 1 BHK, 2 BHK, 3 BHK, etc.)
    bhkConfigurations: [
      {
        bhkType: { type: String, trim: true }, // e.g. '2 BHK', '3 BHK'
        carpetArea: { type: Number }, // sqft
        minPrice: { type: Number },
        maxPrice: { type: Number },
        priceRangeText: { type: String }, // e.g. "₹45 L - ₹65 L"
        availableUnits: { type: Number },
      },
    ],

    // Step 3: Amenities & Landmarks
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    nearbyLandmarks: [
      {
        locationName: { type: String, trim: true }, // e.g. "NH-58"
        distance: { type: String, trim: true }, // e.g. "1.2 km"
      },
    ],
    vastuCompliant: {
      type: Boolean,
      default: false,
    },

    // Step 4: Photos & Plans
    projectPhotos: [
      {
        type: String,
      },
    ],
    masterPlanUrl: {
      type: String,
      trim: true,
    },
    floorPlanUrl: {
      type: String,
      trim: true,
    },
    brochureUrl: {
      type: String,
      trim: true,
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

    // Performance Metrics
    viewsCount: {
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

// Auto-generate Project Submission ID before saving
projectSchema.pre('save', function () {
  if (!this.submissionId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.submissionId = `#GBM-PRJ-${dateStr}-${randomNum}`;
  }
});

// Indexes for searching & filtering
projectSchema.index({ city: 1, projectType: 1, isLive: 1 });
projectSchema.index({ location: '2dsphere' });
projectSchema.index({ projectName: 'text', developerName: 'text', city: 'text', locality: 'text' });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
