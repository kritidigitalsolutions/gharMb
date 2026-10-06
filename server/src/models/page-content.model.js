/**
 * Page Content Model
 * Schema representing system static pages (About Us, Help & Support).
 * Controlled and updated by administrator accounts.
 */

const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Page content type is required.'],
      unique: true,
      enum: {
        values: ['about-us', 'help-support', 'contact-us'],
        message: 'Page content type must be one of: about-us, help-support, contact-us.'
      },
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Administrator reference is required.']
    }
  },
  {
    timestamps: true
  }
);

const PageContent = mongoose.model('PageContent', pageContentSchema);

module.exports = PageContent;
