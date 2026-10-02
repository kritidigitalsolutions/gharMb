/**
 * Favorite / Wishlist Model
 * Records bookmarks or saved listings/projects for app users.
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist item must belong to a user.'],
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    itemType: {
      type: String,
      enum: ['Property', 'Project'],
      default: 'Property',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Custom validation for Mongoose 8/9+
favoriteSchema.pre('validate', function () {
  if (!this.property && !this.project) {
    throw new Error('Wishlist item must reference either a property or a project.');
  }
});

// Composite unique indexes to prevent duplicate bookmarks
favoriteSchema.index({ user: 1, property: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ user: 1, project: 1 }, { unique: true, sparse: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
