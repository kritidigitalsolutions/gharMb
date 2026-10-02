/**
 * Developer Review Model
 * Stores user ratings, comments, and rating aspects (Quality, Timely Delivery, etc.) for developers/builders.
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
      type: String, // e.g. "Quality", "Timely Delivery", "Verified Buyer"
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index to make sure a user has one primary review per developer
developerReviewSchema.index({ developer: 1, reviewer: 1 }, { unique: true });

const DeveloperReview = mongoose.model('DeveloperReview', developerReviewSchema);

module.exports = DeveloperReview;
