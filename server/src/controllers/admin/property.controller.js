/**
 * Admin Property Controller
 * Provides listing review and verification workflows for administrators.
 */

const Property = require('../../models/property.model');

// @desc    Get all properties (with status, price, type filters)
// @route   GET /api/v1/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { status, type, propertyType, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (propertyType) filter.propertyType = propertyType;

    if (search) {
      filter.$text = { $search: search };
    }

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email phone role');

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

// @desc    Review and update property status (approve/reject)
// @route   PATCH /api/v1/admin/properties/:id/status
// @access  Private (Admin only)
exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const { status, verificationStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (verificationStatus) updateData.verificationStatus = verificationStatus;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Property status updated to ${status || property.status}.`,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle property featured spotlight status
// @route   PATCH /api/v1/admin/properties/:id/featured
// @access  Private (Admin only)
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Property featured status set to ${isFeatured}.`,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove/delete property listing from platform
// @route   DELETE /api/v1/admin/properties/:id
// @access  Private (Admin only)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Property listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
