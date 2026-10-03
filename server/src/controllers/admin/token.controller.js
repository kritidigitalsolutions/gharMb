/**
 * Admin Token Controller
 * Manages platform token escrow transactions, token requests moderation,
 * status updates (release to seller / refund to buyer / dispute lock),
 * and administrator configuration of token amounts.
 */

const TokenRequest = require('../../models/token-request.model');
const TokenSetting = require('../../models/token-setting.model');
const Property = require('../../models/property.model');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// @desc    Get all token booking deposits & escrow transactions
// @route   GET /api/admin/tokens
// @access  Private (Admin only)
exports.getAllTokens = async (req, res, next) => {
  try {
    const { status, search, propertyId, page = 1, limit = 20 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 20);

    const filter = {};

    // Status filter matches either escrowStatus or request status
    if (status && status !== 'all' && status !== 'All') {
      const s = status.toLowerCase();
      if (s === 'escrow held' || s === 'escrow_held' || s === 'held') {
        filter.escrowStatus = 'Escrow Held';
      } else if (s === 'released') {
        filter.escrowStatus = 'Released';
      } else if (s === 'refunded') {
        filter.escrowStatus = 'Refunded';
      } else if (s === 'disputed') {
        filter.escrowStatus = 'Disputed';
      } else {
        filter.$or = [{ escrowStatus: status }, { status: status }];
      }
    }

    if (propertyId) {
      filter.property = propertyId;
    }

    // Keyword search across token ID, buyer name, phone, email, notes, UTR
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { tokenRequestId: searchRegex },
        { 'personalDetails.fullName': searchRegex },
        { 'personalDetails.mobileNumber': searchRegex },
        { 'personalDetails.email': searchRegex },
        { 'clientDetails.name': searchRegex },
        { 'clientDetails.phone': searchRegex },
        { 'clientDetails.email': searchRegex },
        { utrRef: searchRegex },
        { transactionId: searchRegex },
      ];
    }

    // Execute KPI queries & list query in parallel
    const [
      tokens,
      totalCount,
      escrowAgg,
      releasedAgg,
      activeCount,
      refundedCount,
      totalTokenCount
    ] = await Promise.all([
      TokenRequest.find(filter)
        .populate('property', 'title locality city price listingFor category submissionId images photos allowTokenBooking tokenAmount tokenAmounts')
        .populate('client', 'name phone email profilePicture role')
        .populate('owner', 'name phone email companyName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TokenRequest.countDocuments(filter),
      TokenRequest.aggregate([
        { $match: { escrowStatus: 'Escrow Held' } },
        { $group: { _id: null, total: { $sum: '$tokenAmount' } } },
      ]),
      TokenRequest.aggregate([
        { $match: { escrowStatus: 'Released' } },
        { $group: { _id: null, total: { $sum: '$tokenAmount' } } },
      ]),
      TokenRequest.countDocuments({ escrowStatus: 'Escrow Held' }),
      TokenRequest.countDocuments({ escrowStatus: 'Refunded' }),
      TokenRequest.countDocuments(),
    ]);

    const totalHeldInEscrow = escrowAgg.length > 0 ? escrowAgg[0].total : 0;
    const totalReleased = releasedAgg.length > 0 ? releasedAgg[0].total : 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    // Format tokens cleanly for frontend consumption
    const formattedTokens = tokens.map((t) => {
      const buyerName = t.personalDetails?.fullName || t.clientDetails?.name || t.client?.name || 'Prospective Buyer';
      const buyerPhone = t.personalDetails?.mobileNumber || t.clientDetails?.phone || t.client?.phone || 'N/A';
      const buyerEmail = t.personalDetails?.email || t.clientDetails?.email || t.client?.email || 'N/A';

      const sellerName = t.owner?.companyName || t.owner?.name || 'Property Owner / Builder';
      const sellerRole = t.owner?.role === 'developer' ? 'Verified Developer' : t.owner?.role === 'agent' ? 'Certified Agent' : 'Property Owner';

      return {
        id: t.tokenRequestId || `#TKN-${t._id.toString().slice(-6)}`,
        mongoId: t._id,
        propertyId: t.property?.submissionId || `#PROP-${t.property?._id.toString().slice(-4)}`,
        propertyTitle: t.property?.title || 'Property Listing',
        propertyCity: t.property?.city || '',
        propertyLocality: t.property?.locality || '',
        buyerName,
        buyerPhone,
        buyerEmail,
        currentCity: t.personalDetails?.currentCity || '',
        familyDetails: t.familyDetails || {
          numberOfFamilyMembers: '1',
          adults: '1',
          children: '0',
          maritalStatus: 'Single',
        },
        occupationDetails: t.occupationDetails || {
          profession: '',
          companyName: '',
          monthlyIncome: '',
        },
        idProof: t.idProof || {
          idProofType: 'Aadhaar',
          documentUrl: '',
        },
        sellerName,
        sellerRole,
        sellerPhone: t.owner?.phone || '',
        sellerEmail: t.owner?.email || '',
        tokenAmount: t.tokenAmount || 2000,
        monthlyRent: t.monthlyRent || t.property?.price || 0,
        totalAgreedPrice: t.totalAgreedPrice || (t.property?.price ? `₹${t.property.price.toLocaleString('en-IN')}` : '₹28,000'),
        paymentPlanType: t.paymentPlanType || 'full_payment',
        installmentPlan: t.installmentPlan || null,
        bookingDate: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        bookingTimestamp: t.createdAt,
        expiryDate: t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Days From Booking',
        escrowBank: t.escrowBank || 'GHARMB Escrow Trust #9910',
        utrRef: t.utrRef || t.transactionId || 'UTR-VERIFIED',
        status: t.escrowStatus || (t.status === 'accepted' ? 'Released' : t.status === 'rejected' ? 'Refunded' : 'Escrow Held'),
        requestStatus: t.status || 'pending',
        paymentStatus: t.paymentStatus || 'paid',
        paymentMethod: t.paymentMethod || 'upi',
        legalStatus: t.escrowStatus === 'Released' ? 'Sale Agreement Executed' : t.escrowStatus === 'Refunded' ? 'Cancelled / Refund Issued' : 'Escrow Booking Recorded',
        notes: t.adminNotes || t.message || 'Platform verified token deposit. All KYC submitted.',
        raw: t,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        tokens: formattedTokens,
        stats: {
          totalHeldInEscrow,
          totalReleased,
          activeCount,
          refundedCount,
          totalTokenCount,
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

// @desc    Get single token request details by ID
// @route   GET /api/admin/tokens/:id
// @access  Private (Admin only)
exports.getTokenById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const token = await TokenRequest.findById(id)
      .populate('property')
      .populate('client', 'name phone email profilePicture role')
      .populate('owner', 'name phone email companyName role');

    if (!token) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token record not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Escrow Status (Release Payout / Refund Buyer / Lock Dispute)
// @route   PATCH /api/admin/tokens/:id/status
// @access  Private (Admin only)
exports.updateTokenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action, notes, utrRef } = req.body;

    const token = await TokenRequest.findById(id)
      .populate('property', 'title owner')
      .populate('client', 'name email phone')
      .populate('owner', 'name email phone');

    if (!token) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token record not found.',
      });
    }

    const targetAction = (action || status || '').toLowerCase();
    let newEscrowStatus = token.escrowStatus;
    let newStatus = token.status;
    let notifTitle = '';
    let notifMessage = '';
    let targetRecipient = null;

    if (targetAction === 'release' || targetAction === 'released') {
      newEscrowStatus = 'Released';
      newStatus = 'accepted';
      token.payoutDate = new Date();
      token.decisionDate = new Date();
      if (utrRef) token.utrRef = utrRef;
      token.adminNotes = notes || `Escrow token ₹${token.tokenAmount.toLocaleString('en-IN')} released to seller ${token.owner?.name || ''}.`;

      // Update property counter
      if (token.property?._id) {
        await Property.findByIdAndUpdate(token.property._id, { $inc: { tokensCount: 1 } });
      }

      notifTitle = 'Escrow Token Deposit Released! 💰';
      notifMessage = `Escrow token deposit of ₹${token.tokenAmount.toLocaleString('en-IN')} for "${token.property?.title}" has been authorized and disbursed to your account.`;
      targetRecipient = token.owner?._id;
    } else if (targetAction === 'refund' || targetAction === 'refunded') {
      newEscrowStatus = 'Refunded';
      newStatus = 'cancelled';
      token.refundDate = new Date();
      token.decisionDate = new Date();
      if (utrRef) token.utrRef = utrRef;
      token.adminNotes = notes || `Token deposit of ₹${token.tokenAmount.toLocaleString('en-IN')} refunded to buyer ${token.client?.name || ''}.`;

      notifTitle = 'Token Booking Refund Processed ↩️';
      notifMessage = `Your token refund of ₹${token.tokenAmount.toLocaleString('en-IN')} for "${token.property?.title}" has been successfully processed.`;
      targetRecipient = token.client?._id;
    } else if (targetAction === 'dispute' || targetAction === 'disputed') {
      newEscrowStatus = 'Disputed';
      token.adminNotes = notes || 'Dispute raised on token deposit. Escrow funds locked.';
    } else if (targetAction === 'escrow held' || targetAction === 'escrow_held') {
      newEscrowStatus = 'Escrow Held';
      token.adminNotes = notes || 'Token deposit held securely in GharMB Escrow.';
    }

    token.escrowStatus = newEscrowStatus;
    token.status = newStatus;
    await token.save();

    // Trigger in-app notification if applicable
    if (targetRecipient && notifTitle) {
      try {
        await Notification.create({
          recipient: targetRecipient,
          title: notifTitle,
          message: notifMessage,
          type: 'token_request',
          metadata: {
            propertyId: token.property?._id,
            tokenRequestId: token._id,
          },
        });
      } catch (err) {
        console.error('Notification dispatch error for token status update:', err.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Token booking updated to "${newEscrowStatus}".`,
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Global Token Amount Settings (Configured by Admin)
// @route   GET /api/admin/tokens/settings
// @access  Private (Admin only)
exports.getTokenSettings = async (req, res, next) => {
  try {
    const settings = await TokenSetting.getSettings();

    res.status(200).json({
      status: 'success',
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Global Token Amount Settings by Admin
// @route   PATCH /api/admin/tokens/settings OR PUT /api/admin/tokens/settings
// @access  Private (Admin only)
exports.updateTokenSettings = async (req, res, next) => {
  try {
    const {
      tokenAmounts,
      defaultTokenAmount,
      minTokenAmount,
      maxTokenAmount,
      allowCustomAmount,
      adjustmentNote,
      validityDays,
      escrowAutoReleaseDays,
    } = req.body;

    let settings = await TokenSetting.getSettings();

    if (Array.isArray(tokenAmounts) && tokenAmounts.length > 0) {
      const validAmounts = tokenAmounts.map((n) => Number(n)).filter((n) => !isNaN(n) && n > 0);
      if (validAmounts.length > 0) {
        settings.tokenAmounts = validAmounts;
      }
    }

    if (defaultTokenAmount && !isNaN(Number(defaultTokenAmount))) {
      settings.defaultTokenAmount = Number(defaultTokenAmount);
    } else if (settings.tokenAmounts.length > 0 && !settings.tokenAmounts.includes(settings.defaultTokenAmount)) {
      settings.defaultTokenAmount = settings.tokenAmounts[0];
    }

    if (minTokenAmount && !isNaN(Number(minTokenAmount))) {
      settings.minTokenAmount = Number(minTokenAmount);
    }

    if (maxTokenAmount && !isNaN(Number(maxTokenAmount))) {
      settings.maxTokenAmount = Number(maxTokenAmount);
    }

    if (allowCustomAmount !== undefined) {
      settings.allowCustomAmount = Boolean(allowCustomAmount);
    }

    if (adjustmentNote) {
      settings.adjustmentNote = String(adjustmentNote).trim();
    }

    if (validityDays && !isNaN(Number(validityDays))) {
      settings.validityDays = Number(validityDays);
    }

    if (escrowAutoReleaseDays && !isNaN(Number(escrowAutoReleaseDays))) {
      settings.escrowAutoReleaseDays = Number(escrowAutoReleaseDays);
    }

    if (req.user) {
      settings.updatedBy = req.user._id;
    }

    await settings.save();

    res.status(200).json({
      status: 'success',
      message: 'Token amount configuration saved successfully.',
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set/Update Token Amount specifically for a Property by Admin
// @route   PATCH /api/admin/tokens/property/:propertyId/settings
// @access  Private (Admin only)
exports.updatePropertyTokenSettings = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { allowTokenBooking, tokenAmount, tokenAmounts, tokenAdjustmentNote } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
    }

    if (allowTokenBooking !== undefined) {
      property.allowTokenBooking = Boolean(allowTokenBooking);
    }

    if (tokenAmount && !isNaN(Number(tokenAmount))) {
      property.tokenAmount = Number(tokenAmount);
    }

    if (Array.isArray(tokenAmounts) && tokenAmounts.length > 0) {
      property.tokenAmounts = tokenAmounts.map((n) => Number(n)).filter((n) => !isNaN(n) && n > 0);
    }

    if (tokenAdjustmentNote) {
      property.tokenAdjustmentNote = String(tokenAdjustmentNote).trim();
    }

    await property.save();

    res.status(200).json({
      status: 'success',
      message: `Token booking amounts updated for "${property.title}".`,
      data: {
        propertyId: property._id,
        allowTokenBooking: property.allowTokenBooking,
        tokenAmount: property.tokenAmount,
        tokenAmounts: property.tokenAmounts,
        tokenAdjustmentNote: property.tokenAdjustmentNote,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Token record permanently by Admin
// @route   DELETE /api/admin/tokens/:id
// @access  Private (Admin only)
exports.deleteToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = await TokenRequest.findByIdAndDelete(id);
    if (!token) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token record not found.'
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Token booking deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Record Token booking manually by Admin
// @route   POST /api/admin/tokens
// @access  Private (Admin only)
exports.createToken = async (req, res, next) => {
  try {
    const {
      buyerName,
      buyerPhone,
      buyerEmail,
      currentCity,
      propertyId,
      tokenAmount,
      monthlyRent,
      paymentMethod,
      utrRef,
      escrowBank,
      notes,
      familyDetails,
      occupationDetails
    } = req.body;

    if (!buyerName || !buyerPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Buyer name and phone number are required.'
      });
    }

    let prop = null;
    if (propertyId && propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      prop = await Property.findById(propertyId);
    }

    const tokenDoc = await TokenRequest.create({
      property: prop ? prop._id : undefined,
      personalDetails: {
        fullName: buyerName.trim(),
        mobileNumber: buyerPhone.trim(),
        email: buyerEmail ? buyerEmail.trim().toLowerCase() : '',
        currentCity: currentCity || ''
      },
      clientDetails: {
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        email: buyerEmail ? buyerEmail.trim().toLowerCase() : ''
      },
      familyDetails: familyDetails || {
        numberOfFamilyMembers: '1',
        adults: '1',
        children: '0',
        maritalStatus: 'Single'
      },
      occupationDetails: occupationDetails || {
        profession: 'Self-employed / Professional',
        companyName: '',
        monthlyIncome: ''
      },
      owner: prop?.owner || undefined,
      tokenAmount: tokenAmount ? Number(tokenAmount) : 2000,
      monthlyRent: monthlyRent ? Number(monthlyRent) : (prop?.price || 0),
      totalAgreedPrice: prop?.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : '₹25,000',
      paymentPlanType: 'full_payment',
      paymentMethod: paymentMethod || 'upi',
      paymentStatus: 'paid',
      escrowStatus: 'Escrow Held',
      escrowBank: escrowBank || 'ICICI Escrow Trust #9910',
      utrRef: utrRef || `UTR-${Date.now()}`,
      status: 'pending',
      adminNotes: notes || 'Token booking recorded by administrator.'
    });

    const populated = await TokenRequest.findById(tokenDoc._id)
      .populate('property', 'title locality city price listingFor category submissionId')
      .populate('client', 'name phone email')
      .populate('owner', 'name phone email companyName');

    res.status(201).json({
      status: 'success',
      message: 'Token booking recorded successfully.',
      data: {
        token: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

