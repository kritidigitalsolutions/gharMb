/**
 * Service Request Model
 * Handles comprehensive customer service inquiries across 4 core verticals:
 * 1. Home Loans & Financial Assistance (Loan)
 * 2. Home Interiors & Fitouts (Interior)
 * 3. Packers & Movers Relocation (Movers)
 * 4. Property Legal, Title Search & Registry (Legal)
 */

const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    serviceRequestId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: {
        values: ['Loan', 'Interior', 'Movers', 'Legal'],
        message: 'serviceType must be Loan, Interior, Movers, or Legal.',
      },
      required: [true, 'Service type is required.'],
      index: true,
    },
    serviceName: {
      type: String,
      required: [true, 'Service name / title is required.'],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Client full name is required.'],
      trim: true,
    },
    clientPhone: {
      type: String,
      required: [true, 'Client contact phone is required.'],
      trim: true,
      index: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'India',
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: false,
    },
    propertyRef: {
      type: String,
      trim: true,
    },
    propertyValue: {
      type: String,
      trim: true,
    },
    propertySize: {
      type: String,
      trim: true,
    },
    loanRequired: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      trim: true,
    },
    monthlyIncome: {
      type: String,
      trim: true,
    },
    cibilScore: {
      type: String,
      trim: true,
    },
    preferredBank: {
      type: String,
      trim: true,
    },
    budgetRange: {
      type: String,
      trim: true,
    },
    designStyle: {
      type: String,
      trim: true,
    },
    scope: [
      {
        type: String,
        trim: true,
      },
    ],
    moveType: {
      type: String,
      trim: true,
    },
    shiftingDate: {
      type: String,
      trim: true,
    },
    packingQuality: {
      type: String,
      trim: true,
    },
    insuranceRequired: {
      type: String,
      trim: true,
    },
    legalServiceScope: {
      type: String,
      trim: true,
    },
    courtJurisdiction: {
      type: String,
      trim: true,
    },
    assignedPartner: {
      type: String,
      trim: true,
    },
    quotation: {
      type: String,
      trim: true,
      default: 'Under Review',
    },
    quotationSubtext: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['In Progress', 'Quotation Sent', 'Confirmed', 'Completed', 'Cancelled'],
        message: 'Status must be In Progress, Quotation Sent, Confirmed, Completed, or Cancelled.',
      },
      default: 'In Progress',
      index: true,
    },
    timeline: [
      {
        stage: { type: String, required: true },
        date: { type: String, default: 'Pending' },
        status: { type: String, enum: ['done', 'active', 'pending'], default: 'pending' },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    notesHistory: [
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

// Pre-save hook to ensure serviceRequestId is generated
serviceRequestSchema.pre('save', function () {
  if (!this.serviceRequestId) {
    const prefix =
      this.serviceType === 'Loan' ? 'SRV-LN' :
      this.serviceType === 'Interior' ? 'SRV-INT' :
      this.serviceType === 'Movers' ? 'SRV-MOV' : 'SRV-LEG';
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.serviceRequestId = `${prefix}-${randomNum}`;
  }
});

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
