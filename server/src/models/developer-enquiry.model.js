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
      required: false,
      index: true,
    },
    developerName: {
      type: String,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    clientDetails: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
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
    channel: {
      type: String,
      default: 'Portal Form',
      trim: true,
    },
    budget: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      default: 'Executive Desk',
      trim: true,
    },
    developerNotes: {
      type: String,
      trim: true,
    },
    notes: [
      {
        text: { type: String, required: true },
        date: { type: String },
        author: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending developer enquiries from the same client for the same developer
developerEnquirySchema.index({ developer: 1, client: 1, status: 1 });

const DeveloperEnquiry = mongoose.model('DeveloperEnquiry', developerEnquirySchema);

module.exports = DeveloperEnquiry;
