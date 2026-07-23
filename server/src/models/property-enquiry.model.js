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
      required: [true, 'An enquiry must be linked to a property.'],
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
      maxlength: [500, 'Message cannot exceed 500 characters.'],
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved', 'cancelled'],
      default: 'pending',
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending enquiries from the same client for the same property
propertyEnquirySchema.index({ property: 1, client: 1, status: 1 });

const PropertyEnquiry = mongoose.model('PropertyEnquiry', propertyEnquirySchema);

module.exports = PropertyEnquiry;
