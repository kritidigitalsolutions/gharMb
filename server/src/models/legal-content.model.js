/**
 * Legal Content Model
 * Schema representing system and custom legal policies (Terms & Conditions, Privacy Policy, Refund Policy, etc.).
 * Controlled and updated by administrator accounts.
 */

const mongoose = require('mongoose');

// Helper to convert rich HTML into clean, human-readable formatted plain text for mobile apps
const htmlToCleanPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi, '\n\n$1\n\n')
    .replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, '\n\n$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

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
    // Sanitized clean text version specifically designed for mobile applications (no HTML tags)
    plainText: {
      type: String,
      trim: true,
      default: ''
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

// Pre-save hook to ensure slug is synchronized with type and plainText is generated
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
  // Automatically generate clean plainText for mobile apps if missing or content changed
  if (this.isModified('content') && (!this.plainText || this.plainText === '')) {
    this.plainText = htmlToCleanPlainText(this.content);
  }
});

const LegalContent = mongoose.model('LegalContent', legalContentSchema);

module.exports = LegalContent;
