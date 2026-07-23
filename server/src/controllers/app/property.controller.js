/**
 * App Property Listing Controller
 * Provides client-side listing publishing, editing, and advanced search filters (price, geo-queries).
 */

const Property = require('../../models/property.model');

// @desc    Retrieve approved properties (filtering, geo-radius queries)
// @route   GET /api/v1/app/properties
// @access  Public
exports.getAllProperties = async (req, res, next) => {
  try {
    const { type, propertyType, minPrice, maxPrice, lat, lng, distanceInKm } = req.query;
    const query = { status: 'approved' }; // Clients only see approved listings

    if (type) query.type = type;
    if (propertyType) query.propertyType = propertyType;

    // Price range filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Geospatial proximity lookup
    if (lat && lng && distanceInKm) {
      const radiusInRadians = Number(distanceInKm) / 6378.1; // Earth's radius in km
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians],
        },
      };
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .populate('owner', 'name profilePicture role isVerified');

    res.status(200).json({
      status: 'success',
      results: properties.length,
      data: {
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve detailed property listing (increments view count)
// @route   GET /api/v1/app/properties/:id
// @access  Public
exports.getPropertyDetails = async (req, res, next) => {
  try {
    // Increment view count dynamically
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'name email phone profilePicture isVerified role');

    if (!property || property.status !== 'approved') {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found or is currently under moderation.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a new property listing (Pending Admin moderation)
// @route   POST /api/v1/app/properties
// @access  Private (Owner/Agent/Builder only)
exports.createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      propertyType,
      price,
      area,
      bedrooms,
      bathrooms,
      address,
      latitude,
      longitude,
      images,
      amenities,
    } = req.body;

    const property = await Property.create({
      title,
      description,
      type,
      propertyType,
      price,
      area,
      bedrooms,
      bathrooms,
      address,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)], // [long, lat]
      },
      images,
      amenities,
      owner: req.user._id,
      status: 'pending', // Requires admin review
    });

    res.status(201).json({
      status: 'success',
      message: 'Property listing created and submitted for review.',
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned property listing
// @route   PUT /api/v1/app/properties/:id
// @access  Private (Owner/Agent/Builder who owns the property)
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this listing.',
      });
    }

    // Extract modifications
    const fieldsToUpdate = req.body;
    if (fieldsToUpdate.latitude && fieldsToUpdate.longitude) {
      fieldsToUpdate.location = {
        type: 'Point',
        coordinates: [Number(fieldsToUpdate.longitude), Number(fieldsToUpdate.latitude)],
      };
      delete fieldsToUpdate.latitude;
      delete fieldsToUpdate.longitude;
    }

    // Demote to pending if critical items change (e.g. price/address) to trigger re-moderation
    if (fieldsToUpdate.price || fieldsToUpdate.address || fieldsToUpdate.title) {
      fieldsToUpdate.status = 'pending';
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Property listing updated. Status reset to pending for verification review.',
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove owned property listing
// @route   DELETE /api/v1/app/properties/:id
// @access  Private (Owner/Agent/Builder who owns the property)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this listing.',
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Property listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
