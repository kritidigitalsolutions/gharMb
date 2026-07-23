/**
 * Property Model
 * Represents real estate listings (for rent or sale).
 * Includes GeoJSON for maps, category fields, pricing, and verification workflows.
 */

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property listing must have a title.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Property listing must have a description.'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['rent', 'sale'],
        message: 'Type must be either rent or sale.',
      },
      required: [true, 'Specify if the property is for rent or sale.'],
    },
    propertyType: {
      type: String,
      enum: {
        values: ['apartment', 'house', 'villa', 'commercial', 'land', 'other'],
        message: 'Invalid property type specified.',
      },
      required: [true, 'Specify the property type.'],
    },
    price: {
      type: Number,
      required: [true, 'Property must have a price.'],
      min: [0, 'Price cannot be negative.'],
    },
    area: {
      type: Number, // Area in square feet/yards
      required: [true, 'Property must have an area measurement.'],
      min: [1, 'Area must be greater than 0.'],
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: [0, 'Bedrooms cannot be negative.'],
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: [0, 'Bathrooms cannot be negative.'],
    },
    address: {
      type: String,
      required: [true, 'Property must have a written address.'],
    },
    // GeoJSON for coordinates (Map searches)
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Geospatial coordinates [long, lat] are required.'],
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length > 0;
        },
        message: 'A property listing must have at least one image.',
      },
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A property listing must belong to an owner.'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'sold', 'rented'],
      default: 'pending',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'in-progress', 'verified'],
      default: 'unverified',
      index: true,
    },
    verificationDocuments: [
      {
        docName: String,
        fileUrl: String,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance optimization
propertySchema.index({ price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ propertyType: 1 });
// 2dsphere index for location-based geospatial queries
propertySchema.index({ location: '2dsphere' });
// Text index for search functionality
propertySchema.index({ title: 'text', description: 'text', address: 'text' });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
