/**
 * Favorite Model
 * Records bookmarks or saved listings for buyers and tenants.
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Favorite must belong to a user.'],
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Favorite must reference a property.'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index to ensure a user cannot favorite the same property twice
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
