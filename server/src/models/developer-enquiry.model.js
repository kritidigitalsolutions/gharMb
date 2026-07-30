/**
 * Developer Enquiry Model
 * Tracks general buyer/tenant enquiries and leads for builders/developers.
 */

const mongoose = require('mongoose');

const developerEnquirySchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An enquiry must belong to a developer.'],
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An enquiry must be associated with a client.'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide an enquiry message.'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters.'],
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved', 'cancelled'],
      default: 'pending',
      index: true,
    },
    developerNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending developer enquiries from the same client for the same developer
developerEnquirySchema.index({ developer: 1, client: 1, status: 1 });

const DeveloperEnquiry = mongoose.model('DeveloperEnquiry', developerEnquirySchema);

module.exports = DeveloperEnquiry;
