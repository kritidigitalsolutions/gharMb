const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for ordering categories by newest first
blogCategorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);
