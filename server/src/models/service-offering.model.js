/**
 * Service Offering / Catalog Model
 * Stores dynamic service packages, pricing, styles, and partners
 * for: Loan, Interior, Movers, and Legal services.
 */

const mongoose = require('mongoose');

const serviceOfferingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: {
        values: ['Interior', 'Movers', 'Legal'],
        message: 'Category must be Interior, Movers, or Legal.',
      },
      required: [true, 'Service category is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Service offering title is required.'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    priceDisplay: {
      type: String,
      trim: true,
      default: 'Contact for Quote',
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    partners: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category ordering
serviceOfferingSchema.index({ category: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceOffering', serviceOfferingSchema);
