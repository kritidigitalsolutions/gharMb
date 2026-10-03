/**
 * Visit Request Model
 * Handles property and site visit scheduling requests between prospective visitors / clients
 * and property owners, including visit date & time, request status, owner accept/reject decision,
 * rejection message / next available schedule, and notifications.
 */

const mongoose = require('mongoose');

const visitRequestSchema = new mongoose.Schema(
  {
    visitRequestId: {
      type: String,
      unique: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Visit request must be linked to a property/site.'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Visit request must be submitted by a user.'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Visit request must have a property owner.'],
      index: true,
    },
    visitDate: {
      type: Date,
      required: [true, 'Scheduled visit date is required.'],
    },
    visitTime: {
      type: String,
      required: [true, 'Scheduled visit time is required.'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled'],
        message: 'Status must be pending, accepted, rejected, or cancelled.',
      },
      default: 'pending',
      index: true,
    },
    ownerMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Owner message cannot exceed 1000 characters.'],
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'User notes cannot exceed 500 characters.'],
    },
    userDetails: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    propertyDetails: {
      title: { type: String, trim: true },
      locality: { type: String, trim: true },
      city: { type: String, trim: true },
      fullAddress: { type: String, trim: true },
    },
    assignedTo: {
      type: String,
      default: 'Executive Desk',
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    followUpNotes: [
      {
        text: { type: String, required: true },
        date: { type: String },
        author: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    decisionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for client -> user to support both user/client references
visitRequestSchema.virtual('client').get(function () {
  return this.user;
});

// Auto-generate Visit Request Tracker ID before saving
visitRequestSchema.pre('save', function () {
  if (!this.visitRequestId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.visitRequestId = `#VST-${dateStr}-${randomNum}`;
  }
});

// Compound indexes for fast query resolution
visitRequestSchema.index({ owner: 1, status: 1 });
visitRequestSchema.index({ user: 1, status: 1 });
visitRequestSchema.index({ property: 1, status: 1 });
visitRequestSchema.index({ visitDate: 1 });

const VisitRequest = mongoose.model('VisitRequest', visitRequestSchema);

module.exports = VisitRequest;
