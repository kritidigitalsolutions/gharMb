/**
 * Property Enquiry Model
 * Tracks customer leads, enquiries, and booking requests for property listings.
 */

const mongoose = require('mongoose');

const propertyEnquirySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: false,
      index: true,
    },
    propertyName: {
      type: String,
      trim: true,
    },
    location: {
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
      required: false,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters.'],
      default: 'General property enquiry.',
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
    visitPreferredDate: {
      type: Date, // Supports future Visit Booking feature
    },
    visitTimeSlot: {
      type: String, // e.g. "10:00 AM - 12:00 PM"
    },
    agentNotes: {
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

// Prevent duplicate pending enquiries from the same client for the same property
propertyEnquirySchema.index({ property: 1, client: 1, status: 1 });

const PropertyEnquiry = mongoose.model('PropertyEnquiry', propertyEnquirySchema);

module.exports = PropertyEnquiry;
