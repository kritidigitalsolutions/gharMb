/**
 * Legal Content Model
 * Schema representing system and custom legal policies (Terms & Conditions, Privacy Policy, Refund Policy, etc.).
 * Controlled and updated by administrator accounts.
 */

const mongoose = require('mongoose');

const legalContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Content type/slug is required.'],
      unique: true,
      trim: true,
      lowercase: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
      trim: true
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    platform: {
      type: String,
      enum: ['both', 'web', 'app'],
      default: 'both'
    },
    showInFooter: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure slug is synchronized with type
legalContentSchema.pre('save', function () {
  if (!this.slug) {
    this.slug = this.type;
  }
  if (!this.type) {
    this.type = this.slug;
  }
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

const LegalContent = mongoose.model('LegalContent', legalContentSchema);

module.exports = LegalContent;

