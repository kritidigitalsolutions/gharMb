/**
 * Admin Model
 * Schema representing system administrators managing the GHARMB real estate platform.
 * Employs local authentication credentials and secure bcrypt hashing.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin must have a name.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Admin must have a login email.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Admin must have a password.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Prevents sending password by default
    },
    role: {
      type: String,
      default: 'admin', // Static role designation
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to the database
adminSchema.pre('save', async function () {
  // Only hash password if it was modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
