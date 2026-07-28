/**
 * Legal Content Model
 * Schema representing system legal contents (Terms & Conditions, Privacy Policy).
 * Controlled and updated by administrator accounts.
 */

const mongoose = require('mongoose');

const legalContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Content type is required.'],
      unique: true,
      enum: {
        values: ['terms', 'privacy-policy'],
        message: 'Content type must be one of: terms, privacy-policy.'
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

const LegalContent = mongoose.model('LegalContent', legalContentSchema);

module.exports = LegalContent;
