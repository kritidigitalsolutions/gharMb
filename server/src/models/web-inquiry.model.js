/**
 * Web Inquiry Model
 * Stores submissions from Website Contact Us forms & Account Deletion requests.
 */

const mongoose = require('mongoose');

const webInquirySchema = new mongoose.Schema(
  {
    refId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['contact', 'deletion_request'],
      default: 'contact',
      required: [true, 'Inquiry type is required.'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full name.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email address.'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide mobile number.'],
      trim: true,
      index: true,
    },
    role: {
      type: String,
      trim: true,
      default: 'seeker',
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters.'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters.'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters.'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters.'],
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'contacted', 'resolved', 'rejected'],
      default: 'new',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin notes cannot exceed 2000 characters.'],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-generate Ref ID if not set
webInquirySchema.pre('save', function () {
  if (!this.refId) {
    const prefix = this.type === 'deletion_request' ? 'GMB-DEL' : 'GMB-INQ';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.refId = `${prefix}-${randomNum}`;
  }
});

const WebInquiry = mongoose.model('WebInquiry', webInquirySchema);

module.exports = WebInquiry;
