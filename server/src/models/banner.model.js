/**
 * Home & Promotional Banner Model
 * Schema supporting Home Page hero carousel, middle promo cards, 
 * commercial spaces promos, click & view analytics, and deep linking.
 */

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [250, 'Subtitle cannot exceed 250 characters.'],
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required.'],
      trim: true,
    },
    mobileImage: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: [
        'home_top',       // Main hero carousel on home page
        'home_middle',    // Middle promotional card / strip
        'home_bottom',    // Bottom promo banner
        'commercial',     // Commercial spaces section banner
        'residential',    // Residential properties section banner
        'popup',          // Promotional modal / popup
      ],
      default: 'home_top',
      index: true,
    },
    linkType: {
      type: String,
      enum: [
        'none',           // Non-clickable informational banner
        'property',       // Navigates to residential property details
        'commercial',     // Navigates to commercial space details or listings
        'project',        // Navigates to developer project details
        'category',       // Filter by category (e.g. 'Commercial', 'Residential', 'Plots')
        'screen',         // In-app mobile screen navigation (e.g. 'CommercialSpacesScreen')
        'external_url',   // External web link
      ],
      default: 'none',
    },
    linkValue: {
      type: String,
      trim: true,
      default: '',
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'Explore Now',
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for querying active banners sorted by order
bannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
