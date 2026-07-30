/**
 * Developer Review Model
 * Stores buyer/tenant ratings and comments for verified developers/builders.
 */

const mongoose = require('mongoose');

const developerReviewSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must be linked to a developer.'],
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
      type: String, // e.g. "Bought a premium project", "Verified Buyer"
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to make sure a buyer can only review a developer once
developerReviewSchema.index({ developer: 1, reviewer: 1 }, { unique: true });

const DeveloperReview = mongoose.model('DeveloperReview', developerReviewSchema);

module.exports = DeveloperReview;
