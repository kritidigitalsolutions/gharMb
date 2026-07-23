/**
 * User Model
 * Defines schema for Buyers, Tenants, Property Owners, Real Estate Agents, and Builders.
 * Uses local password credentials.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'A user must have a password.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Prevents loading password by default
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
      required: [true, 'A user must have a role.'],
    },
    profilePicture: {
      type: String,
      default: 'default-avatar.png',
    },
    isVerified: {
      type: Boolean,
      default: false, // For Agent/Builder verification workflow
    },
    verificationDocuments: [
      {
        docType: String, // e.g. 'RERA_LICENSE', 'AADHAAR', 'PAN'
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      select: false, // Prevents loading inactive users by default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for listings owned by this user
userSchema.virtual('properties', {
  ref: 'Property',
  foreignField: 'owner',
  localField: '_id',
});

// Hash password before saving to the database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Middleware to skip inactive users in queries
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
