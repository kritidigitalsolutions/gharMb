/**
 * Admin Referral / Reference Network Controller
 * Manages ambassador referrals, peer recommendations, reward payouts,
 * and status transitions across the referral deal lifecycle.
 */

const Referral = require('../../models/referral.model');
const Property = require('../../models/property.model');
const User = require('../../models/user.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// @desc    Get all referrals with live KPI metrics
// @route   GET /api/admin/referrals
// @access  Private (Admin only)
exports.getAllReferrals = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 50);

    const filter = {};

    // Status filter
    if (status && status !== 'All' && status !== 'all') {
      filter.payoutStatus = status;
    }

    // Keyword search across referrer, referee, property, referral code, payoutRefId
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { referralId: searchRegex },
        { referrerName: searchRegex },
        { referrerPhone: searchRegex },
        { referrerEmail: searchRegex },
        { referralCode: searchRegex },
        { refereeName: searchRegex },
        { refereePhone: searchRegex },
        { refereeEmail: searchRegex },
        { propertyTitle: searchRegex },
        { payoutRefId: searchRegex },
        { bankDetails: searchRegex },
        { upiId: searchRegex },
      ];
    }

    // Execute queries in parallel for high speed
    const [
      referrals,
      totalCount,
      paidAgg,
      eligibleAgg,
      dealInProgressCount,
      paidCount,
      eligibleCount,
      totalReferralsCount
    ] = await Promise.all([
      Referral.find(filter)
        .populate('linkedProperty', 'title city locality price submissionId')
        .populate('referrerUser', 'name phone email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Referral.countDocuments(filter),
      Referral.aggregate([
        { $match: { payoutStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$rewardAmount' } } },
      ]),
      Referral.aggregate([
        { $match: { payoutStatus: 'Eligible for Payout' } },
        { $group: { _id: null, total: { $sum: '$rewardAmount' } } },
      ]),
      Referral.countDocuments({ payoutStatus: 'Deal In Progress' }),
      Referral.countDocuments({ payoutStatus: 'Paid' }),
      Referral.countDocuments({ payoutStatus: 'Eligible for Payout' }),
      Referral.countDocuments(),
    ]);

    const totalRewardsPaid = paidAgg.length > 0 ? paidAgg[0].total : 0;
    const totalEligible = eligibleAgg.length > 0 ? eligibleAgg[0].total : 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    // Clean formatting for frontend consumption
    const formattedReferrals = referrals.map((r) => {
      const propTitle = r.linkedProperty?.title || r.propertyTitle || 'Direct Consultation Deal';
      const propSubId = r.linkedProperty?.submissionId || (r.linkedProperty?._id ? `#PROP-${r.linkedProperty._id.toString().slice(-4)}` : '');

      return {
        id: r.referralId || `#REF-${r._id.toString().slice(-6)}`,
        mongoId: r._id,
        referrerName: r.referrerName,
        referrerPhone: r.referrerPhone,
        referrerEmail: r.referrerEmail || '',
        referrerRole: r.referrerRole || 'Resident Ambassador',
        referralCode: r.referralCode || 'REF-ACTIVE',
        refereeName: r.refereeName,
        refereePhone: r.refereePhone,
        refereeEmail: r.refereeEmail || '',
        linkedProperty: propTitle,
        propertySubId: propSubId,
        propertyCity: r.linkedProperty?.city || '',
        dealValue: r.dealValue || 'On Request',
        rewardAmount: r.rewardAmount || 0,
        payoutStatus: r.payoutStatus || 'Deal In Progress',
        payoutDate: r.payoutDate || (r.payoutStatus === 'Paid' ? 'Settled' : 'Pending Settlement'),
        payoutRefId: r.payoutRefId || '',
        payoutMethod: r.payoutMethod || 'UPI',
        bankDetails: r.bankDetails || '',
        upiId: r.upiId || '',
        createdDate: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        notes: r.notes || '',
        raw: r,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        referrals: formattedReferrals,
        stats: {
          totalRewardsPaid,
          totalEligible,
          activeDealsCount: dealInProgressCount,
          paidCount,
          eligibleCount,
          totalReferralsCount,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single referral details by ID
// @route   GET /api/admin/referrals/:id
// @access  Private (Admin only)
exports.getReferralById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referral = await Referral.findById(id)
      .populate('linkedProperty')
      .populate('referrerUser', 'name phone email');

    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        referral,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new Referral manually by Admin
// @route   POST /api/admin/referrals
// @access  Private (Admin only)
exports.createReferral = async (req, res, next) => {
  try {
    const {
      referrerName,
      referrerPhone,
      referrerEmail,
      referrerRole,
      referralCode,
      refereeName,
      refereePhone,
      refereeEmail,
      linkedProperty,
      propertyTitle,
      dealValue,
      rewardAmount,
      payoutStatus,
      bankDetails,
      upiId,
      notes,
    } = req.body;

    if (!referrerName || !referrerPhone || !refereeName || !refereePhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Referrer Name, Referrer Phone, Referee Name, and Referee Phone are required.',
      });
    }

    let prop = null;
    if (linkedProperty && linkedProperty.match(/^[0-9a-fA-F]{24}$/)) {
      prop = await Property.findById(linkedProperty);
    }

    const cleanReward = Number(rewardAmount) || 20000;
    const cleanDeal = dealValue ? String(dealValue).trim() : (prop?.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : '₹1.50 Cr');
    const cleanPropTitle = prop?.title || propertyTitle || 'Direct Listing Consultation';

    const timestampPart = Date.now().toString().slice(-6);
    const generatedReferralId = `#REF-${timestampPart}`;

    const cleanCode = referralCode && referralCode.trim()
      ? referralCode.trim().toUpperCase()
      : `${referrerName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReferral = await Referral.create({
      referralId: generatedReferralId,
      referrerName: referrerName.trim(),
      referrerPhone: referrerPhone.trim(),
      referrerEmail: referrerEmail ? referrerEmail.trim().toLowerCase() : '',
      referrerRole: referrerRole || 'Resident Ambassador',
      referralCode: cleanCode,
      refereeName: refereeName.trim(),
      refereePhone: refereePhone.trim(),
      refereeEmail: refereeEmail ? refereeEmail.trim().toLowerCase() : '',
      linkedProperty: prop ? prop._id : undefined,
      propertyTitle: cleanPropTitle,
      dealValue: cleanDeal,
      rewardAmount: cleanReward,
      payoutStatus: payoutStatus || 'Deal In Progress',
      payoutDate: payoutStatus === 'Paid' ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      payoutRefId: '',
      bankDetails: bankDetails ? bankDetails.trim() : '',
      upiId: upiId ? upiId.trim() : '',
      notes: notes ? notes.trim() : 'Referral registered by Administrator in Ambassador Network.',
      createdBy: req.user?._id || undefined,
    });

    const populated = await Referral.findById(newReferral._id).populate('linkedProperty', 'title city locality price submissionId');

    res.status(201).json({
      status: 'success',
      message: 'Referral deal registered successfully.',
      data: {
        referral: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process Referral Payout Settlement
// @route   PATCH /api/admin/referrals/:id/payout
// @access  Private (Admin only)
exports.processPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payoutRefId, payoutMethod, notes } = req.body;

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    referral.payoutStatus = 'Paid';
    referral.payoutDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (payoutRefId) referral.payoutRefId = payoutRefId.trim();
    if (payoutMethod) referral.payoutMethod = payoutMethod.trim();
    if (notes) referral.notes = `${referral.notes || ''} | Payout Ref: ${payoutRefId || 'Settled'} - ${notes}`.trim();

    await referral.save();

    res.status(200).json({
      status: 'success',
      message: `Commission payout of ₹${referral.rewardAmount.toLocaleString()} marked as Paid.`,
      data: {
        referral,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Referral Status (Eligible for Payout / Deal In Progress / Pending Audit)
// @route   PATCH /api/admin/referrals/:id/status
// @access  Private (Admin only)
exports.updateReferralStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payoutStatus, notes } = req.body;

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    if (payoutStatus) referral.payoutStatus = payoutStatus;
    if (notes) referral.notes = `${referral.notes || ''} | Status changed to ${payoutStatus}: ${notes}`.trim();

    await referral.save();

    res.status(200).json({
      status: 'success',
      message: `Referral status updated to "${referral.payoutStatus}".`,
      data: {
        referral,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update general Referral fields
// @route   PATCH /api/admin/referrals/:id
// @access  Private (Admin only)
exports.updateReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const referral = await Referral.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('linkedProperty', 'title city locality price submissionId');

    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Referral details updated successfully.',
      data: {
        referral,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Referral permanently by Admin
// @route   DELETE /api/admin/referrals/:id
// @access  Private (Admin only)
exports.deleteReferral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referral = await Referral.findByIdAndDelete(id);

    if (!referral) {
      return res.status(404).json({
        status: 'fail',
        message: 'Referral record not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Referral record permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};
