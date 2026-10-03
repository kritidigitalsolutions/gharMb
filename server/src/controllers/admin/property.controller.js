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
    const { category, listingFor, approvalStatus, search, owner, keyHandover } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (listingFor) filter.listingFor = listingFor;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (owner) filter.owner = owner;
    if (keyHandover !== undefined) {
      filter.keyHandover = keyHandover === 'true' || keyHandover === true;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { submissionId: searchRegex },
        { propertyType: searchRegex },
        { listingAs: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.max(1, Math.min(5000, parseInt(req.query.limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email phone role isVerified companyName'),
      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: properties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
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
    const rawStatus = req.body.approvalStatus || req.body.status;
    const rejectionReason = req.body.rejectionReason || req.body.rejectReason;

    if (!rawStatus || !['approved', 'rejected', 'pending'].includes(rawStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid approvalStatus or status (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      approvalStatus: rawStatus,
      isLive: rawStatus === 'approved',
    };

    if (rawStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (rawStatus === 'approved') {
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

    // Send notification to the property owner / agent / developer
    try {
      const Notification = require('../../models/notification.model');
      if (rawStatus === 'approved') {
        await Notification.create({
          recipient: property.owner._id,
          title: 'Property Listing Approved & Live! 🏡',
          message: `Your property listing "${property.title}" (${property.submissionId || ''}) has been verified and approved by admin. It is now live for all buyers/tenants.`,
          type: 'verification',
          isRead: false,
        });
      } else if (rawStatus === 'rejected') {
        await Notification.create({
          recipient: property.owner._id,
          title: 'Property Listing Review Update',
          message: `Your property listing "${property.title}" was not approved. Reason: ${rejectionReason || 'Please review property details/documents and re-submit.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating user notification for property moderation:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `Property listing approval status updated to ${rawStatus}.`,
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

// @desc    Update property listing details by Admin (including installment options & pricing)
// @route   PUT /api/admin/properties/:id OR PATCH /api/admin/properties/:id
// @access  Private (Admin only)
exports.updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    const updateFields = { ...req.body };

    // Handle installment options normalization
    if (updateFields.allowInstallments !== undefined || updateFields.installmentDetails !== undefined) {
      const allowInstallments = updateFields.allowInstallments === true || updateFields.allowInstallments === 'true';
      updateFields.allowInstallments = allowInstallments;
      if (allowInstallments && updateFields.installmentDetails) {
        const details = typeof updateFields.installmentDetails === 'string'
          ? JSON.parse(updateFields.installmentDetails)
          : updateFields.installmentDetails;

        const price = Number(updateFields.price) || Number(property.price) || 0;
        let downPaymentAmount = Number(details.downPaymentAmount) || 0;
        let downPaymentPercentage = Number(details.downPaymentPercentage) || 0;

        if (downPaymentPercentage > 0 && (!downPaymentAmount || downPaymentAmount === 0) && price > 0) {
          downPaymentAmount = Math.round((price * downPaymentPercentage) / 100);
        } else if (downPaymentAmount > 0 && price > 0 && (!downPaymentPercentage || downPaymentPercentage === 0)) {
          downPaymentPercentage = Math.round((downPaymentAmount / price) * 100);
        }

        const numberOfInstallments = Number(details.numberOfInstallments) || 0;
        let installmentAmount = Number(details.installmentAmount) || 0;

        if ((!installmentAmount || installmentAmount === 0) && numberOfInstallments > 0 && price > 0) {
          const remainingBalance = Math.max(0, price - downPaymentAmount);
          installmentAmount = Math.round(remainingBalance / numberOfInstallments);
        }

        const freq = details.installmentFrequency || 'Monthly';
        const durationMonths = Number(details.installmentDurationMonths) || (
          freq === 'Quarterly' ? numberOfInstallments * 3 :
          freq === 'Bi-annual' ? numberOfInstallments * 6 :
          freq === 'Yearly' ? numberOfInstallments * 12 :
          numberOfInstallments
        );

        updateFields.installmentDetails = {
          downPaymentAmount,
          downPaymentPercentage,
          numberOfInstallments,
          installmentFrequency: freq,
          installmentAmount,
          interestRate: Number(details.interestRate) || 0,
          installmentDurationMonths: durationMonths,
          gracePeriodDays: Number(details.gracePeriodDays) || 0,
          termsAndConditions: (details.termsAndConditions || '').trim(),
          milestones: Array.isArray(details.milestones) ? details.milestones : [],
        };
      } else if (!allowInstallments) {
        updateFields.installmentDetails = {
          downPaymentAmount: 0,
          downPaymentPercentage: 0,
          numberOfInstallments: 0,
          installmentFrequency: 'Monthly',
          installmentAmount: 0,
          interestRate: 0,
          installmentDurationMonths: 0,
          gracePeriodDays: 0,
          termsAndConditions: '',
          milestones: [],
        };
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email phone role isVerified');

    res.status(200).json({
      status: 'success',
      message: 'Property listing updated successfully.',
      data: {
        property: updatedProperty,
      },
    });
  } catch (error) {
    next(error);
  }
};

