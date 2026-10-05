/**
 * Admin Token Controller
 * Manages property token booking requests moderation, status updates (accept / reject / cancel / pending),
 * and administrator configuration of token reservation amounts.
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

    // Status filter matches token request status
    if (status && status !== 'all' && status !== 'All') {
      const s = status.toLowerCase();
      if (s === 'approved' || s === 'accepted') {
        filter.status = 'accepted';
      } else if (s === 'declined' || s === 'rejected') {
        filter.status = 'rejected';
      } else if (s === 'cancelled') {
        filter.status = 'cancelled';
      } else if (s === 'contacted' || s === 'contact') {
        filter.status = 'contacted';
      } else if (s === 'pending') {
        filter.status = 'pending';
      } else {
        filter.status = status;
      }
    }

    if (propertyId) {
      filter.property = propertyId;
    }

    // Keyword search across token ID, buyer name, phone, email, notes
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
        { adminNotes: searchRegex },
        { contactNotes: searchRegex },
        { message: searchRegex },
      ];
    }

    const validProps = await Property.distinct('_id');
    if (!filter.property) {
      filter.property = { $in: validProps };
    }

    // Execute list query & status counts in parallel
    const baseCountFilter = { property: { $in: validProps } };
    const [
      tokens,
      totalCount,
      pendingCount,
      contactedCount,
      acceptedCount,
      rejectedCount,
      cancelledCount,
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
      TokenRequest.countDocuments({ ...baseCountFilter, status: 'pending' }),
      TokenRequest.countDocuments({ ...baseCountFilter, status: 'contacted' }),
      TokenRequest.countDocuments({ ...baseCountFilter, status: 'accepted' }),
      TokenRequest.countDocuments({ ...baseCountFilter, status: 'rejected' }),
      TokenRequest.countDocuments({ ...baseCountFilter, status: 'cancelled' }),
      TokenRequest.countDocuments(baseCountFilter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    // Format tokens cleanly for frontend consumption
    const formattedTokens = tokens.map((t) => {
      const buyerName = t.personalDetails?.fullName || t.clientDetails?.name || t.client?.name || 'Prospective Tenant';
      const buyerPhone = t.personalDetails?.mobileNumber || t.clientDetails?.phone || t.client?.phone || 'N/A';
      const buyerEmail = t.personalDetails?.email || t.clientDetails?.email || t.client?.email || 'N/A';

      const sellerName = t.owner?.companyName || t.owner?.name || 'Property Owner / Builder';
      const sellerRole = t.owner?.role === 'developer' ? 'Verified Developer' : t.owner?.role === 'agent' ? 'Certified Agent' : 'Property Owner';
      const isRental = t.property?.listingFor === 'Rent' || t.property?.listingFor === 'Lease' || t.property?.listingFor === 'PG';

      return {
        id: t.tokenRequestId || `#TKN-${t._id.toString().slice(-6)}`,
        mongoId: t._id,
        propertyId: t.property?.submissionId || `#PROP-${t.property?._id.toString().slice(-4)}`,
        propertyTitle: t.property?.title || 'Rental Listing',
        propertyCity: t.property?.city || '',
        propertyLocality: t.property?.locality || '',
        listingFor: t.property?.listingFor || 'Rent',
        isRental,
        buyerName,
        buyerPhone,
        buyerEmail,
        currentCity: t.personalDetails?.currentCity || t.clientDetails?.currentCity || '',
        requestSource: t.requestSource || 'one_click',
        handledByAdmin: t.handledByAdmin !== false,
        outOfAppStatus: t.outOfAppStatus || (t.status === 'accepted' ? 'token_received' : t.status === 'contacted' ? 'contacted' : 'pending_contact'),
        contactNotes: t.contactNotes || '',
        lastContactedAt: t.lastContactedAt,
        tokenReceivedAmount: t.tokenReceivedAmount || 0,
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
        totalAgreedPrice: t.totalAgreedPrice || (t.property?.price ? `₹${t.property.price.toLocaleString('en-IN')}` : '₹25,000'),
        paymentPlanType: t.paymentPlanType || 'full_payment',
        installmentPlan: t.installmentPlan || null,
        bookingDate: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        bookingTimestamp: t.createdAt,
        expiryDate: t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '7 Days From Booking',
        status: t.status || 'pending',
        requestStatus: t.status || 'pending',
        legalStatus: t.status === 'accepted' ? 'Token Received Offline' : t.status === 'contacted' ? 'Contacted / In Discussion' : t.status === 'rejected' ? 'Request Declined' : t.status === 'cancelled' ? 'Booking Cancelled' : 'Pending Admin Contact',
        notes: t.adminNotes || t.contactNotes || t.message || '1-Click token request submitted directly to admin.',
        raw: t,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        tokens: formattedTokens,
        stats: {
          totalRequests: totalTokenCount,
          pendingCount,
          contactedCount,
          acceptedCount,
          rejectedCount,
          cancelledCount,
          totalHeldInEscrow: 0,
          totalReleased: 0,
          activeCount: pendingCount + contactedCount,
          refundedCount: cancelledCount,
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

// @desc    Update Token Request Status (Accept / Reject / Cancel / Pending)
// @route   PATCH /api/admin/tokens/:id/status
// @access  Private (Admin only)
exports.updateTokenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action, notes } = req.body;

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
    let newStatus = token.status;
    let notifTitle = '';
    let notifMessage = '';
    let targetRecipient = null;

    if (targetAction === 'contact' || targetAction === 'contacted') {
      newStatus = 'contacted';
      token.outOfAppStatus = 'contacted';
      token.lastContactedAt = new Date();
      token.contactNotes = notes || token.contactNotes || 'Admin contacted client out of the app.';
      token.adminNotes = notes || 'Client contacted out of app.';
      notifTitle = 'Token Request Update: Admin Contacted 📞';
      notifMessage = `GharMB admin has initiated contact for your token request on "${token.property?.title}".`;
      targetRecipient = token.client?._id;
    } else if (targetAction === 'accept' || targetAction === 'accepted' || targetAction === 'token_received' || targetAction === 'release' || targetAction === 'released' || targetAction === 'approve' || targetAction === 'approved') {
      newStatus = 'accepted';
      token.outOfAppStatus = 'token_received';
      token.decisionDate = new Date();
      token.tokenReceivedDate = new Date();
      if (req.body.tokenReceivedAmount) {
        token.tokenReceivedAmount = Number(req.body.tokenReceivedAmount);
      }
      token.adminNotes = notes || `Token deposit received out-of-app.`;

      // Update property counter
      if (token.property?._id) {
        await Property.findByIdAndUpdate(token.property._id, { $inc: { tokensCount: 1 } });
      }

      notifTitle = 'Rental Token Booking Confirmed! 🎉';
      notifMessage = `Your token booking request for rental property "${token.property?.title}" has been confirmed by Admin!`;
      targetRecipient = token.client?._id;
    } else if (targetAction === 'reject' || targetAction === 'rejected' || targetAction === 'declined' || targetAction === 'refund' || targetAction === 'refunded') {
      newStatus = 'rejected';
      token.outOfAppStatus = 'rejected';
      token.decisionDate = new Date();
      token.rejectionReason = notes || 'Declined by administrator';
      token.adminNotes = notes || 'Token booking request rejected.';

      notifTitle = 'Token Booking Request Declined';
      notifMessage = `Token booking request for "${token.property?.title}" was not accepted.`;
      targetRecipient = token.client?._id;
    } else if (targetAction === 'cancel' || targetAction === 'cancelled') {
      newStatus = 'cancelled';
      token.outOfAppStatus = 'cancelled';
      token.decisionDate = new Date();
      token.adminNotes = notes || 'Token booking request cancelled.';
    } else if (targetAction === 'pending') {
      newStatus = 'pending';
      token.outOfAppStatus = 'pending_contact';
      token.adminNotes = notes || 'Token booking set to pending contact.';
    }

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
      message: `Token booking request updated to "${newStatus}".`,
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
    let isRental = true;
    if (propertyId && propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      prop = await Property.findById(propertyId);
      if (prop) {
        isRental = prop.listingFor === 'Rent' || prop.listingFor === 'Lease' || prop.listingFor === 'PG';
      }
    }

    const tokenDoc = await TokenRequest.create({
      property: prop ? prop._id : undefined,
      isRental,
      isTokenApplicable: isRental,
      tokenAmount: isRental ? (Number(tokenAmount) || 2000) : 0,
      personalDetails: {
        fullName: buyerName.trim(),
        mobileNumber: buyerPhone.trim(),
        email: buyerEmail ? buyerEmail.trim().toLowerCase() : '',
        currentCity: currentCity || ''
      },
      clientDetails: {
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        email: buyerEmail ? buyerEmail.trim().toLowerCase() : '',
        currentCity: currentCity || ''
      },
      requestSource: 'admin_manual',
      handledByAdmin: true,
      outOfAppStatus: 'pending_contact',
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

