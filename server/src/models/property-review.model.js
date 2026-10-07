/**
 * Property Review Model
 * Stores user ratings (1-5 stars), review comments, and tags for individual properties.
 * Also indexes the property owner for fast aggregation of owner ratings.
 */

const mongoose = require('mongoose');

const propertyReviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Review must be linked to a property.'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must reference the property owner.'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an author.'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating (1-5).'],
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot be more than 5.0'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comment text.'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters.'],
    },
    tag: {
      type: String, // e.g. "Accurate Photos", "Great Location", "Responsive Owner"
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    reviewerName: {
      type: String,
      trim: true,
      default: '',
    },
    reviewerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    reviewerRole: {
      type: String,
      trim: true,
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: A reviewer can have one active review per property
propertyReviewSchema.index({ property: 1, reviewer: 1 }, { unique: true });
propertyReviewSchema.index({ owner: 1, createdAt: -1 });

const PropertyReview = mongoose.model('PropertyReview', propertyReviewSchema);

module.exports = PropertyReview;
