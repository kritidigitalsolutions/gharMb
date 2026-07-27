/**
 * User Schema Model
 * Supports Client Auth, Roles (Buyer, Tenant, Owner, Agent, Builder/Developer),
 * Agent Verification, Developer/Builder Verification, Preferences, and Notifications.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['buyer', 'tenant', 'owner', 'agent', 'builder'],
        message: 'Role must be: buyer, tenant, owner, agent, or builder.',
      },
    },
    address: {
      formattedAddress: { type: String, trim: true },
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Agent Verification Details
    reraNumber: {
      type: String,
      trim: true,
    },
    experience: {
      type: String, // '< 1 yr', '1-3 yrs', '3-5 yrs', '5+ yrs'
      trim: true,
    },
    cityOfOperation: {
      type: String,
      trim: true,
    },
    verificationDocs: {
      reraCertificate: { type: String, trim: true },
      aadhaarCard: { type: String, trim: true },
      profilePhoto: { type: String, trim: true },
    },
    agentVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified',
      index: true,
    },
    agentRejectionReason: {
      type: String,
      trim: true,
    },

    // Developer / Builder Company Verification Details
    companyName: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    yearsInBusiness: {
      type: String, // '< 2 yrs', '2-5 yrs', '5-10 yrs', '10+ yrs'
      trim: true,
    },
    builderDocs: {
      reraCertificate: { type: String, trim: true },
      panCard: { type: String, trim: true },
      companyLogo: { type: String, trim: true },
    },
    builderVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified',
      index: true,
    },
    builderRejectionReason: {
      type: String,
      trim: true,
    },

    // User Onboarding Preferences
    intents: [
      {
        type: String, // 'buy', 'rent', 'commercial', 'sell', 'explore_projects'
      },
    ],
    preferences: {
      propertyTypes: [{ type: String }],
      minBudget: { type: Number, default: 0 },
      maxBudget: { type: Number, default: 100000000 },
      preferredCities: [{ type: String }],
      bedrooms: [{ type: String }],
    },

    // Notification Toggles
    notificationSettings: {
      priceDropAlerts: { type: Boolean, default: true },
      newListingAlerts: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      platformUpdates: { type: Boolean, default: true },
    },

    isOnboardingCompleted: {
      type: Boolean,
      default: false,
    },

    profilePicture: {
      type: String,
      default: 'default-avatar.png',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'mobile'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
