/**
 * Admin Property Controller
 * Provides listing review and verification workflows for administrators.
 */

const Property = require('../../models/property.model');

// @desc    Get all properties (with category, status, approvalStatus, search filters)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { category, listingFor, approvalStatus, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (listingFor) filter.listingFor = listingFor;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    if (search) {
      filter.$text = { $search: search };
    }

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email phone role isVerified');

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

// @desc    Review and update property approval status (approve / reject)
// @route   PATCH /api/admin/properties/:id/status
// @access  Private (Admin only)
exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;

    if (!approvalStatus || !['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid approvalStatus (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      approvalStatus,
      isLive: approvalStatus === 'approved',
    };

    if (approvalStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (approvalStatus === 'approved') {
      updateData.rejectionReason = undefined;
    }

    const property = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email phone');

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Property listing approval status updated to ${approvalStatus}.`,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle property featured tier status
// @route   PATCH /api/admin/properties/:id/featured
// @access  Private (Admin only)
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { listingTier } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { listingTier: listingTier || 'Featured' },
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
      message: `Property listing tier updated to ${property.listingTier}.`,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove/delete property listing from platform
// @route   DELETE /api/admin/properties/:id
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
