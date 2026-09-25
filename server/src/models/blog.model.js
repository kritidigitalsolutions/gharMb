const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: true,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      default: '',
    },

    bannerImage: {
      type: String,
      default: '',
    },

    author: {
      type: String,
      default: 'GharMB Editorial',
      trim: true,
    },

    readTime: {
      type: Number,
      default: 5,
    },

    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Blog', blogSchema);
