/**
 * Admin Property Controller
 * Provides listing review and verification workflows for administrators.
 */

const mongoose = require('mongoose');
const Property = require('../../models/property.model');
const User = require('../../models/user.model');
const TokenRequest = require('../../models/token-request.model');
const VisitRequest = require('../../models/visit-request.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');
const Favorite = require('../../models/favorite.model');
const Notification = require('../../models/notification.model');

/**
 * Normalizes possession date to Month & Year only (e.g. "June 2028", "Dec 2026")
 * or standard milestone terms like "Ready to Move", "Immediate".
 * Prevents calendar day numbers (e.g., converts "30 June 2028" or "2028-06-30" -> "June 2028").
 */
const normalizePossessionDate = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  // Standard milestone terms
  if (/^(ready\s*to\s*move|immediate|under\s*construction)$/i.test(trimmed)) {
    return trimmed;
  }

  // Matches YYYY-MM from month pickers
  const yyyyMmMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMmMatch) {
    const year = parseInt(yyyyMmMatch[1], 10);
    const month = parseInt(yyyyMmMatch[2], 10);
    const d = new Date(year, month - 1, 1);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  // Matches dates with days like "30 June 2028", "June 30, 2028", "2028-06-30", "30-06-2028"
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2200) {
    const hasSpecificDay = /\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b|\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b/.test(trimmed);
    if (hasSpecificDay) {
      return parsed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  return trimmed;
};

// @desc    Get all properties (with category, status, approvalStatus, search filters)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { category, listingFor, approvalStatus, search, owner, keyHandover, saleStatus, isSold } = req.query;
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
    if (saleStatus) filter.saleStatus = saleStatus;
    if (isSold !== undefined) {
      filter.isSold = isSold === 'true' || isSold === true;
    }
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

      const isVideoCheck = (url) => {
        if (!url || typeof url !== 'string') return false;
        try {
          const decoded = decodeURIComponent(url).toLowerCase();
          const cleanPath = decoded.split('?')[0];
          return (
            /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
            decoded.includes('/video/') ||
            decoded.includes('/videos/') ||
            decoded.includes('video/mp4') ||
            decoded.includes('format=mp4') ||
            decoded.includes('contenttype=video') ||
            decoded.includes('uploads%2fvideo') ||
            decoded.includes('uploads/video')
          );
        } catch (_) {
          return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
        }
      };

      const rawImages = Array.isArray(obj.images) ? obj.images : (Array.isArray(obj.photos) ? obj.photos : []);
      const rawVideos = Array.isArray(obj.videos) ? obj.videos : (Array.isArray(obj.propertyVideos) ? obj.propertyVideos : []);

      const pureImages = [];
      const pureVideos = [];

      for (const item of [...rawImages, ...rawVideos]) {
        if (typeof item !== 'string' || !item.trim()) continue;
        const trimmed = item.trim();
        if (isVideoCheck(trimmed)) {
          if (!pureVideos.includes(trimmed)) pureVideos.push(trimmed);
        } else {
          if (!pureImages.includes(trimmed)) pureImages.push(trimmed);
        }
      }

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
        possessionDate: normalizePossessionDate(obj.possessionDate),
        postedBy,
        adminCommission: obj.adminCommission || { type: 'percentage', rate: 2, amount: Math.round((Number(obj.price || 0) * 2) / 100) },
        commissionDiscount: obj.commissionDiscount || {
          enabled: false,
          discountType: 'percentage',
          discountValue: 0,
          discountAmount: 0,
          netCommission: obj.adminCommission?.amount || Math.round((Number(obj.price || 0) * 2) / 100),
          discountOnCommissionOnly: true,
          notes: '',
        },
        investmentScore: obj.investmentScore && obj.investmentScore.metrics ? obj.investmentScore : {
          overall: Number(obj.investmentScore?.overall) || 0,
          grade: obj.investmentScore?.grade || 'Not Rated',
          metrics: {
            connectivity: Number(obj.investmentScore?.metrics?.connectivity) || 0,
            rentalPotential: Number(obj.investmentScore?.metrics?.rentalPotential) || 0,
            growthPotential: Number(obj.investmentScore?.metrics?.growthPotential) || 0,
            familyLiving: Number(obj.investmentScore?.metrics?.familyLiving) || 0,
            futureDemand: Number(obj.investmentScore?.metrics?.futureDemand) || 0,
          },
        },
        images: pureImages,
        photos: pureImages,
        videos: pureVideos,
        propertyVideos: pureVideos,
        video: pureVideos[0] || null,
        videoUrl: pureVideos[0] || null,
        hasVideo: pureVideos.length > 0,
        videoCount: pureVideos.length,
        gallery: [
          ...pureImages.map((u) => ({ url: u, type: 'image' })),
          ...pureVideos.map((u) => ({ url: u, type: 'video' })),
        ],
        // Sale status properties for admin moderation
        isSold: Boolean(obj.isSold),
        saleStatus: obj.saleStatus || 'available',
        soldMarkedAt: obj.soldMarkedAt || null,
        saleConfirmationDueDate: obj.saleConfirmationDueDate || null,
        saleNotificationSent: Boolean(obj.saleNotificationSent),
        saleConfirmedAt: obj.saleConfirmedAt || null,
        isPendingSaleConfirmation: obj.saleStatus === 'marked_as_sold',
        saleNotes: obj.saleNotes || '',
        // Multiple BHK configurations (ONLY BHK and its custom Price)
        bhkConfigurations: Array.isArray(obj.bhkConfigurations)
          ? obj.bhkConfigurations.map((b) => ({
              bhk: b.bhk || b.bhkType || '',
              bhkType: b.bhk || b.bhkType || '',
              price: Number(b.price) || 0,
            }))
          : [],
        hasMultipleBhk: Array.isArray(obj.bhkConfigurations) && obj.bhkConfigurations.length > 0,
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
const calculateCommissionAndDiscount = (price, rawCommission, rawDiscount, isBuilder = false) => {
  const hasCustomCommission =
    Boolean(rawCommission && (Number(rawCommission.rate) > 0 || Number(rawCommission.amount) > 0)) ||
    Boolean(rawDiscount && (rawDiscount.enabled === true || rawDiscount.enabled === 'true'));

  // DEVELOPER RULE: Default commission is 0% for builder listings UNLESS explicitly configured by admin
  if (isBuilder && !hasCustomCommission) {
    return {
      adminCommission: {
        type: 'percentage',
        rate: 0,
        amount: 0,
      },
      commissionDiscount: {
        enabled: false,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        netCommission: 0,
        discountOnCommissionOnly: true,
        appliedAt: undefined,
        notes: 'Developer / Builder listings carry 0% platform commission.',
      },
    };
  }

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
        const isBuilder =
          existingProp.userRole === 'builder' ||
          existingProp.postedByRole === 'Builder' ||
          (existingProp.listingAs || '').toLowerCase().includes('builder') ||
          (existingProp.listingAs || '').toLowerCase().includes('developer');

        const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
          existingProp.price,
          req.body.adminCommission || existingProp.adminCommission,
          req.body.commissionDiscount || existingProp.commissionDiscount,
          isBuilder
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
    if (req.body.possessionDate !== undefined) {
      updateFields.possessionDate = normalizePossessionDate(req.body.possessionDate);
    }

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

    // Security deposit and duration rule: Remove / clear for properties available for sale
    const targetListingFor = updateFields.listingFor || property.listingFor;
    if (String(targetListingFor || '').trim().toLowerCase() === 'sale') {
      updateFields.securityDeposit = undefined;
      updateFields.securityDepositDuration = undefined;
    }

    // Handle multiple BHK configurations: ONLY BHK and its Price
    if (updateFields.bhkConfigurations !== undefined) {
      let configs = updateFields.bhkConfigurations;
      if (typeof configs === 'string') {
        try {
          configs = JSON.parse(configs);
        } catch {
          configs = [];
        }
      }
      if (Array.isArray(configs)) {
        updateFields.bhkConfigurations = configs
          .map((item) => ({
            bhk: item.bhk || item.bhkType || '',
            bhkType: item.bhk || item.bhkType || '',
            price: Number(item.price) || 0,
          }))
          .filter((b) => b.bhk && b.price > 0);
      } else {
        updateFields.bhkConfigurations = [];
      }
    }

    // Handle Admin Commission and Commission Discount updates
    if (updateFields.adminCommission !== undefined || updateFields.commissionDiscount !== undefined) {
      const isBuilder =
        property.userRole === 'builder' ||
        property.postedByRole === 'Builder' ||
        (property.listingAs || '').toLowerCase().includes('builder') ||
        (property.listingAs || '').toLowerCase().includes('developer');

      const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
        updateFields.price || property.price,
        updateFields.adminCommission || property.adminCommission,
        updateFields.commissionDiscount || property.commissionDiscount,
        isBuilder
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

    const isBuilder =
      property.userRole === 'builder' ||
      property.postedByRole === 'Builder' ||
      (property.listingAs || '').toLowerCase().includes('builder') ||
      (property.listingAs || '').toLowerCase().includes('developer');

    const { adminCommission, commissionDiscount } = calculateCommissionAndDiscount(
      property.price,
      req.body.adminCommission || property.adminCommission,
      req.body.commissionDiscount !== undefined ? req.body.commissionDiscount : req.body,
      isBuilder
    );

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { adminCommission, commissionDiscount },
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone role isVerified');

    res.status(200).json({
      status: 'success',
      message: 'Property commission and discount settings updated successfully.',
      data: {
        property: updatedProperty,
        pricingSummary: {
          originalPrice: updatedProperty.price,
          discountAmount: commissionDiscount.discountAmount,
          effectivePrice: Math.max(0, updatedProperty.price - commissionDiscount.discountAmount),
          grossCommission: adminCommission.amount,
          netCommission: commissionDiscount.netCommission,
          sellerPayout: updatedProperty.price,
          discountOnCommissionOnly: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property investment score (Admin Curated)
// @route   PUT /api/admin/properties/:id/investment-score
// @access  Private (Admin only)
exports.updateInvestmentScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { submissionId: id };
    const property = await Property.findOne(query);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    const connectivity = Number(req.body.connectivity ?? req.body.metrics?.connectivity);
    const rentalPotential = Number(req.body.rentalPotential ?? req.body.metrics?.rentalPotential);
    const growthPotential = Number(req.body.growthPotential ?? req.body.metrics?.growthPotential);
    const familyLiving = Number(req.body.familyLiving ?? req.body.metrics?.familyLiving);
    const futureDemand = Number(req.body.futureDemand ?? req.body.metrics?.futureDemand);

    if (
      isNaN(connectivity) ||
      isNaN(rentalPotential) ||
      isNaN(growthPotential) ||
      isNaN(familyLiving) ||
      isNaN(futureDemand)
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'All 5 metrics (connectivity, rentalPotential, growthPotential, familyLiving, futureDemand) are required numbers between 0 and 10.',
      });
    }

    const metricsList = [connectivity, rentalPotential, growthPotential, familyLiving, futureDemand];
    if (metricsList.some((val) => val < 0 || val > 10)) {
      return res.status(400).json({
        status: 'fail',
        message: 'All metric scores must be between 0 and 10.',
      });
    }

    const {
      roundToOneDecimal,
      calculateGrade,
      calculateOverallFromMetrics,
    } = require('../../utils/investmentScore.helper');

    const metrics = {
      connectivity: roundToOneDecimal(connectivity),
      rentalPotential: roundToOneDecimal(rentalPotential),
      growthPotential: roundToOneDecimal(growthPotential),
      familyLiving: roundToOneDecimal(familyLiving),
      futureDemand: roundToOneDecimal(futureDemand),
    };

    const overall = req.body.overall !== undefined
      ? roundToOneDecimal(Number(req.body.overall))
      : calculateOverallFromMetrics(metrics);

    const grade = req.body.grade || calculateGrade(overall);

    const investmentScoreData = {
      overall,
      grade,
      metrics,
      updatedAt: new Date(),
    };

    const updatedProperty = await Property.findOneAndUpdate(
      query,
      { investmentScore: investmentScoreData },
      { new: true, runValidators: true }
    );

    const fullScoreResponse = {
      overall: updatedProperty.investmentScore.overall,
      grade: updatedProperty.investmentScore.grade,
      metrics: updatedProperty.investmentScore.metrics,
      connectivity: updatedProperty.investmentScore.metrics?.connectivity ?? metrics.connectivity,
      rentalPotential: updatedProperty.investmentScore.metrics?.rentalPotential ?? metrics.rentalPotential,
      growthPotential: updatedProperty.investmentScore.metrics?.growthPotential ?? metrics.growthPotential,
      familyLiving: updatedProperty.investmentScore.metrics?.familyLiving ?? metrics.familyLiving,
      futureDemand: updatedProperty.investmentScore.metrics?.futureDemand ?? metrics.futureDemand,
    };

    res.status(200).json({
      status: 'success',
      message: 'Property investment score updated successfully.',
      data: {
        investmentScore: fullScoreResponse,
        property: updatedProperty,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get property investment score
// @route   GET /api/admin/properties/:id/investment-score
// @access  Private (Admin only)
exports.getInvestmentScore = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).select('title submissionId investmentScore city locality category');

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        investmentScore: property.investmentScore,
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a property as sold by Admin (initiates 3-day confirmation countdown)
// @route   PATCH /api/admin/properties/:id/mark-sold
// @access  Private (Admin only)
exports.markPropertyAsSold = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, triggerDays } = req.body;

    const property = await Property.findById(id).populate('owner', 'name email phone');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    // Days until confirmation notification triggers (default 3 days, support custom / 0 for testing)
    const days = triggerDays !== undefined && !isNaN(Number(triggerDays)) ? Number(triggerDays) : 3;
    const soldMarkedAt = new Date();
    const saleConfirmationDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    property.saleStatus = 'marked_as_sold';
    property.soldMarkedAt = soldMarkedAt;
    property.saleConfirmationDueDate = saleConfirmationDueDate;
    property.saleNotificationSent = false;
    property.soldByAdmin = req.admin?._id;
    property.saleNotes = notes || req.body.saleNotes || 'Marked as sold by Admin';
    // Notice: Property remains visible/available in the app until confirmation
    await property.save();

    // Trigger immediate notification if days === 0 (instant test mode)
    if (days === 0) {
      const { checkAndTriggerSaleConfirmationNotifications } = require('../../services/saleConfirmation.service');
      await checkAndTriggerSaleConfirmationNotifications();
    } else {
      // Send preliminary notice to owner
      try {
        if (property.owner && (property.owner._id || property.owner)) {
          await Notification.create({
            recipient: property.owner._id || property.owner,
            title: 'Property Listing Marked as Sold 🏷️',
            message: `Your property "${property.title}" has been marked as sold by admin. A sale confirmation notification will be verified after 3 days.`,
            type: 'property_sale',
            metadata: {
              propertyId: property._id,
              submissionId: property.submissionId,
              action: 'marked_as_sold',
            },
            isRead: false,
          });
        }
      } catch (notifErr) {
        console.warn('⚠️ Notification creation notice:', notifErr.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Property "${property.title}" marked as sold. Sale confirmation notification will trigger in ${days} day(s).`,
      data: {
        property,
        saleStatus: property.saleStatus,
        soldMarkedAt: property.soldMarkedAt,
        saleConfirmationDueDate: property.saleConfirmationDueDate,
        daysUntilConfirmation: days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm or reject property sale status by Admin
//          - If confirmed: property is marked as sold and NO LONGER displayed in the app (isLive: false)
//          - If not confirmed: property remains available in the app (isLive: true, saleStatus: available)
// @route   PATCH /api/admin/properties/:id/confirm-sale
// @access  Private (Admin only)
exports.confirmPropertySale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirmed, notes } = req.body;

    const isConfirmed = confirmed === true || confirmed === 'true';

    const property = await Property.findById(id).populate('owner', 'name email phone');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    if (isConfirmed) {
      // 1. Confirmed: Property is marked sold and removed from app display
      property.isSold = true;
      property.saleStatus = 'sold';
      property.isLive = false; // No longer displayed in the app
      property.saleConfirmedAt = new Date();
      if (notes) property.saleNotes = notes;
      await property.save();

      // Notifications
      try {
        if (property.owner && (property.owner._id || property.owner)) {
          await Notification.create({
            recipient: property.owner._id || property.owner,
            title: 'Property Sale Confirmed! 🎉',
            message: `Congratulations! Your property "${property.title}" sale has been officially confirmed by admin. The listing has been archived from public feeds.`,
            type: 'property_sale',
            metadata: {
              propertyId: property._id,
              submissionId: property.submissionId,
              action: 'sale_confirmed',
            },
            isRead: false,
          });
        }
      } catch (notifErr) {
        console.warn('⚠️ Owner notification notice:', notifErr.message);
      }

      return res.status(200).json({
        status: 'success',
        message: `Property sale confirmed successfully! The listing "${property.title}" is officially sold and will no longer be displayed in the app.`,
        data: {
          property,
          isSold: true,
          isLive: false,
          saleStatus: 'sold',
          displayedInApp: false,
        },
      });
    } else {
      // 2. Not Confirmed: Property remains available in the app
      property.isSold = false;
      property.saleStatus = 'available';
      if (property.approvalStatus === 'approved') {
        property.isLive = true; // Remains available in the app
      }
      property.saleCancelledAt = new Date();
      if (notes) property.saleNotes = notes;
      await property.save();

      // Notifications
      try {
        if (property.owner && (property.owner._id || property.owner)) {
          await Notification.create({
            recipient: property.owner._id || property.owner,
            title: 'Property Sale Not Confirmed - Listing Active 🏡',
            message: `The sale for your property "${property.title}" was not confirmed. Your listing remains active and available on GharMB.`,
            type: 'property_sale',
            metadata: {
              propertyId: property._id,
              submissionId: property.submissionId,
              action: 'sale_not_confirmed',
            },
            isRead: false,
          });
        }
      } catch (notifErr) {
        console.warn('⚠️ Owner notification notice:', notifErr.message);
      }

      return res.status(200).json({
        status: 'success',
        message: `Property sale was not confirmed. The listing "${property.title}" remains active and available in the app.`,
        data: {
          property,
          isSold: false,
          isLive: property.isLive,
          saleStatus: 'available',
          displayedInApp: true,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check and trigger 3-day sale confirmation notifications manually or on-demand
// @route   GET /api/admin/properties/check-sale-confirmations
// @access  Private (Admin only)
exports.checkSaleConfirmations = async (req, res, next) => {
  try {
    const { checkAndTriggerSaleConfirmationNotifications } = require('../../services/saleConfirmation.service');
    const result = await checkAndTriggerSaleConfirmationNotifications();

    res.status(200).json({
      status: 'success',
      message: `Sale confirmation check executed successfully. ${result.count} notification(s) triggered.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Instantly toggle Sold Out status on a property by Admin
// @route   PATCH /api/admin/properties/:id/toggle-sold
// @access  Private (Admin only)
exports.toggleSoldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isSold, notes } = req.body;

    const property = await Property.findById(id).populate('owner', 'name email phone');
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'No property found with that ID.',
      });
    }

    const targetSold = isSold !== undefined ? (isSold === true || isSold === 'true') : !property.isSold;

    property.isSold = targetSold;
    property.saleStatus = targetSold ? 'sold' : 'available';
    // If approved, keep live so clients can view the "Sold Out" state with disabled actions
    if (property.approvalStatus === 'approved') {
      property.isLive = true;
    }
    if (targetSold) {
      property.soldMarkedAt = new Date();
      property.saleConfirmedAt = new Date();
      property.soldByAdmin = req.admin?._id;
      property.saleNotes = notes || 'Marked as Sold Out by Admin';
    } else {
      property.saleCancelledAt = new Date();
      property.saleNotes = notes || 'Relisted as Available by Admin';
    }

    await property.save();

    // Send notification to Owner
    try {
      if (property.owner && (property.owner._id || property.owner)) {
        await Notification.create({
          recipient: property.owner._id || property.owner,
          title: targetSold ? 'Property Listing Marked as Sold Out 🏷️' : 'Property Listing Relisted as Available 🏡',
          message: targetSold
            ? `Your property "${property.title}" has been marked as Sold Out by admin.`
            : `Your property "${property.title}" has been relisted as available on GharMB.`,
          type: 'property_sale',
          metadata: {
            propertyId: property._id,
            submissionId: property.submissionId,
            action: targetSold ? 'marked_sold' : 'relisted',
          },
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.warn('⚠️ Notification notice:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: targetSold
        ? `Property "${property.title}" marked as Sold Out.`
        : `Property "${property.title}" relisted as Available.`,
      data: {
        property,
        isSold: property.isSold,
        saleStatus: property.saleStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};



