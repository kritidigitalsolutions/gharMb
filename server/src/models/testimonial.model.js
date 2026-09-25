const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  quote: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
  },
  location: {
    type: String,
  },
  propertyType: {
    type: String,
  },
  journeyType: {
    type: String,
  },
  stages: {
    type: [String],
    default: ["Discover", "Verify", "Understand", "Decide"]
  },
  activeStageIndex: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
  },
  propertyImage: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
