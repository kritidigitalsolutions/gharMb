/**
 * Admin Property Controller
 * Provides listing review and verification workflows for administrators.
 */

const Property = require('../../models/property.model');
const User = require('../../models/user.model');
const TokenRequest = require('../../models/token-request.model');
const VisitRequest = require('../../models/visit-request.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');
const Favorite = require('../../models/favorite.model');
const Notification = require('../../models/notification.model');

// @desc    Get all properties (with category, status, approvalStatus, search filters)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { category, listingFor, approvalStatus, search, owner, keyHandover } = req.query;
    const filter = {};

    // Ensure only properties belonging to existing registered users are returned
    const validUserIds = await User.distinct('_id');
    if (owner) {
      filter.owner = owner;
    } else {
      filter.owner = { $in: validUserIds };
    }

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
        .populate('owner', 'name email phone role isVerified companyName reraNumber builderVerificationStatus agentVerificationStatus'),
      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const enrichedProperties = properties.map((p) => {
      const obj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
      const ownerObj = (obj.owner && typeof obj.owner === 'object') ? obj.owner : {};
      const ownerRole = (ownerObj.role || 'owner').toLowerCase();
      const rawListing = (obj.listingAs || '').toLowerCase();
      const rawUserRole = (obj.userRole || '').toLowerCase();

      let effectiveRole = 'owner';
      let effectivePostedByRole = 'Owner';
      let effectiveListingAs = 'Owner';

      if (rawListing.includes('builder') || rawListing.includes('developer') || rawUserRole === 'builder' || ownerRole === 'builder') {
        effectiveRole = 'builder';
        effectivePostedByRole = 'Builder';
        effectiveListingAs = 'Developer / Builder';
      } else if (rawListing.includes('agent') || rawListing.includes('broker') || rawUserRole === 'agent' || ownerRole === 'agent') {
        effectiveRole = 'agent';
        effectivePostedByRole = 'Agent';
        effectiveListingAs = 'Agent / Broker';
      } else {
        effectiveRole = 'owner';
        effectivePostedByRole = 'Owner';
        effectiveListingAs = 'Owner';
      }

      const roleTitle =
        effectiveRole === 'builder'
          ? 'Builder Profile'
          : effectiveRole === 'agent'
          ? 'Agent Profile'
          : 'Owner Profile';

      const isOwnerVerified = Boolean(
        ownerObj.isVerified ||
        ownerObj.builderVerificationStatus === 'approved' ||
        ownerObj.agentVerificationStatus === 'approved'
      );

      const postedBy = {
        id: ownerObj._id || ownerObj.id || null,
        _id: ownerObj._id || ownerObj.id || null,
        name: ownerObj.name || '',
        phone: ownerObj.phone || '',
        email: ownerObj.email || '',
        role: effectiveRole,
        roleTitle,
        isVerified: isOwnerVerified,
        verificationBadge: isOwnerVerified ? 'Verified' : 'Unverified',
        companyName: ownerObj.companyName || '',
        reraNumber: ownerObj.reraNumber || '',
      };

      return {
        ...obj,
        id: obj._id,
        listingAs: effectiveListingAs,
        userRole: effectiveRole,
        role: effectiveRole,
        roleTitle,
        postedByRole: effectivePostedByRole,
        listedBy: effectivePostedByRole,
        sellerRole: effectivePostedByRole,
        ownerRole: effectiveRole,
        companyName: ownerObj.companyName || '',
        reraNumber: ownerObj.reraNumber || '',
        postedBy,
      };
    });

    res.status(200).json({
      status: 'success',
      results: enrichedProperties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties: enrichedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to calculate and normalize Admin Commission & Commission-Absorbed Discount
const calculateCommissionAndDiscount = (price, rawCommission, rawDiscount) => {
  const propPrice = Number(price) || 0;

  // Commission calculation
  const cType = rawCommission?.type === 'fixed' ? 'fixed' : 'percentage';
  const cRate = cType === 'percentage' ? (Number(rawCommission?.rate) >= 0 ? Number(rawCommission.rate) : 2) : 0;
  const cAmount = cType === 'percentage' ? Math.round((propPrice * cRate) / 100) : Math.round(Number(rawCommission?.amount || 0));

  const adminCommission = {
    type: cType,
    rate: cRate,
    amount: cAmount,
  };

  // Discount calculation (strictly deducted from Admin Commission, seller payout is never reduced)
  const isEnabled = Boolean(rawDiscount?.enabled);
  const dType = rawDiscount?.discountType === 'fixed' ? 'fixed' : 'percentage';
  const dVal = Number(rawDiscount?.discountValue) || 0;
  let dAmount = 0;

  if (isEnabled && dVal > 0) {
    if (dType === 'percentage') {
      dAmount = Math.round((cAmount * Math.min(100, Math.max(0, dVal))) / 100);
    } else {
      dAmount = Math.round(Math.min(cAmount, Math.max(0, dVal)));
    }
  }

  const commissionDiscount = {
    enabled: isEnabled,
    discountType: dType,
    discountValue: dVal,
    discountAmount: dAmount,
    netCommission: Math.max(0, cAmount - dAmount),
    discountOnCommissionOnly: true,
    appliedAt: isEnabled ? new Date() : undefined,
    notes: (rawDiscount?.notes || '').trim(),
  };

  return { adminCommission, commissionDiscount };
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

    const existingProp = await Property.findById(req.params.id);
    if (!existingProp) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
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

      // Handle Admin Commission & Commission-Absorbed Discount configured at verification
      if (req.body.adminCommission !== undefined || req.body.commissionDiscount !== undefined) {
        const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
          existingProp.price,
          req.body.adminCommission || existingProp.adminCommission,
          req.body.commissionDiscount || existingProp.commissionDiscount
        );
        updateData.adminCommission = adminCommission;
        updateData.commissionDiscount = commissionDiscount;
      }
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
          metadata: {
            propertyId: property._id,
          },
          isRead: false,
        });

        // Ensure refer & earn reward is credited for first verified listing
        try {
          const { processFirstListingReferralReward } = require('../../utils/referralCode.helper');
          await processFirstListingReferralReward(property.owner._id, property._id, property.title);
        } catch (refErr) {
          console.warn('⚠️ [Admin Property Approval Referral Reward Notice]:', refErr.message);
        }
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

    // Cascade delete all dependent records
    await Promise.allSettled([
      TokenRequest.deleteMany({ property: property._id }),
      VisitRequest.deleteMany({ property: property._id }),
      PropertyEnquiry.deleteMany({ property: property._id }),
      Favorite.deleteMany({ property: property._id }),
      Notification.deleteMany({ 'metadata.propertyId': property._id }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Property listing and associated records deleted successfully.',
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

    // Handle Admin Commission and Commission Discount updates
    if (updateFields.adminCommission !== undefined || updateFields.commissionDiscount !== undefined) {
      const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
        updateFields.price || property.price,
        updateFields.adminCommission || property.adminCommission,
        updateFields.commissionDiscount || property.commissionDiscount
      );
      updateFields.adminCommission = adminCommission;
      updateFields.commissionDiscount = commissionDiscount;
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

// @desc    Update Admin Commission & Commission-Absorbed Discount anytime (Admin can edit later)
// @route   PATCH /api/admin/properties/:id/commission-discount
// @access  Private (Admin only)
exports.updateCommissionDiscount = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email phone role isVerified');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
      property.price,
      req.body.adminCommission || property.adminCommission,
      req.body.commissionDiscount !== undefined ? req.body.commissionDiscount : req.body
    );

    property.adminCommission = adminCommission;
    property.commissionDiscount = commissionDiscount;
    await property.save();

    res.status(200).json({
      status: 'success',
      message: 'Property commission and discount settings updated successfully.',
      data: {
        property,
        pricingSummary: {
          originalPrice: property.price,
          discountAmount: commissionDiscount.discountAmount,
          effectivePrice: Math.max(0, property.price - commissionDiscount.discountAmount),
          grossCommission: adminCommission.amount,
          netCommission: commissionDiscount.netCommission,
          sellerPayout: property.price,
          discountOnCommissionOnly: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

