/**
 * Token Request Controller
 * Handles token booking workflows for real estate properties:
 * - Buyers can submit 5-step token booking requests (personal, family, occupation, ID proof, token amount)
 * - Returns dynamic token booking configuration set by administrators
 * - Owners / Builders / Agents can view received token requests, accept, or reject them
 * - Updates property counters and triggers in-app notifications
 */

const TokenRequest = require('../../models/token-request.model');
const Property = require('../../models/property.model');
const Notification = require('../../models/notification.model');
const TokenSetting = require('../../models/token-setting.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// @desc    Get Token Booking Configuration (Amounts configured by Admin)
// @route   GET /api/token-requests/config OR GET /api/user/token-requests/config
// @access  Public / Private
exports.getTokenConfig = async (req, res, next) => {
  try {
    const { propertyId } = req.query;
    const globalSettings = await TokenSetting.getSettings();

    let config = {
      tokenAmounts: globalSettings.tokenAmounts || [2000, 5000],
      defaultTokenAmount: globalSettings.defaultTokenAmount || 2000,
      minTokenAmount: globalSettings.minTokenAmount || 1000,
      maxTokenAmount: globalSettings.maxTokenAmount || 100000,
      allowCustomAmount: globalSettings.allowCustomAmount || false,
      adjustmentNote: globalSettings.adjustmentNote || "Token amount will be adjusted in security deposit or first month's rent",
      allowTokenBooking: true,
      property: null,
    };

    if (propertyId) {
      const property = await Property.findById(propertyId)
        .select('title price category listingFor allowTokenBooking tokenAmount tokenAmounts tokenAdjustmentNote securityDeposit owner city locality')
        .populate('owner', 'name phone email companyName');

      if (property) {
        config.property = {
          id: property._id,
          title: property.title,
          price: property.price,
          monthlyRent: property.listingFor === 'Rent' || property.listingFor === 'Lease' || property.listingFor === 'PG' ? property.price : null,
          category: property.category,
          listingFor: property.listingFor,
          city: property.city,
          locality: property.locality,
          owner: property.owner,
        };

        config.allowTokenBooking = property.allowTokenBooking !== false;

        // If property has specific token amounts configured by admin/owner
        if (Array.isArray(property.tokenAmounts) && property.tokenAmounts.length > 0) {
          config.tokenAmounts = property.tokenAmounts;
        }

        if (property.tokenAmount) {
          config.defaultTokenAmount = property.tokenAmount;
        }

        if (property.tokenAdjustmentNote) {
          config.adjustmentNote = property.tokenAdjustmentNote;
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new Token Booking Request for a property (5-Step Mobile & Web Workflow)
// @route   POST /api/user/token-requests OR POST /api/properties/:id/token-request
// @access  Private (Buyer / Client)
exports.createTokenRequest = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.body.property || req.body.propertyId;
    const {
      tokenAmount,
      message,
      paymentMethod,
      transactionId,
      paymentPlanType,
      installmentPlan,
      personalDetails,
      familyDetails,
      occupationDetails,
      idProof,
      monthlyRent,
      totalAgreedPrice,
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Property ID is required to submit a token request.',
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
    }

    // Owner cannot send token request to their own property
    if (property.owner && req.user && property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a token request for your own property listing.',
      });
    }

    // Check if token bookings are allowed for this property
    if (property.allowTokenBooking === false) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token booking is temporarily unavailable for this property listing.',
      });
    }

    // Validate installment plan selection against owner preference
    const selectedPlan = (paymentPlanType || 'full_payment').toLowerCase();
    if (selectedPlan === 'installment') {
      if (!property.allowInstallments) {
        return res.status(400).json({
          status: 'fail',
          message: 'The owner of this property requires direct full payment. Installment / EMI option is not enabled for this site.',
        });
      }
    }

    // Parse installment plan if provided
    let parsedInstallment = undefined;
    if (selectedPlan === 'installment') {
      const rawInst = typeof installmentPlan === 'string' ? JSON.parse(installmentPlan || '{}') : (installmentPlan || {});
      parsedInstallment = {
        downPaymentAmount: Number(rawInst.downPaymentAmount || rawInst.downPayment) || property.installmentDetails?.downPaymentAmount || 0,
        numberOfInstallments: Number(rawInst.numberOfInstallments) || property.installmentDetails?.numberOfInstallments || 0,
        installmentFrequency: rawInst.installmentFrequency || property.installmentDetails?.installmentFrequency || 'Monthly',
        installmentAmount: Number(rawInst.installmentAmount) || property.installmentDetails?.installmentAmount || 0,
        totalPayable: Number(rawInst.totalPayable) || property.price || 0,
        proposedTerms: (rawInst.proposedTerms || rawInst.terms || '').trim(),
      };
    }

    // Check if client already has a pending token request for this property
    const existingPending = await TokenRequest.findOne({
      property: propertyId,
      client: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have a pending token request for this property.',
        data: { tokenRequest: existingPending },
      });
    }

    // Determine token amount (from body, or property config, or global setting)
    let numericAmount = Number(tokenAmount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      numericAmount = property.tokenAmount || 2000;
    }

    // Parse Personal Details
    const parsedPersonal = typeof personalDetails === 'string' ? JSON.parse(personalDetails || '{}') : (personalDetails || {});
    const finalPersonalDetails = {
      fullName: parsedPersonal.fullName || parsedPersonal.name || req.user.name || '',
      mobileNumber: parsedPersonal.mobileNumber || parsedPersonal.phone || req.user.phone || '',
      email: parsedPersonal.email || req.user.email || '',
      currentCity: parsedPersonal.currentCity || parsedPersonal.city || '',
    };

    // Parse Family Details
    const parsedFamily = typeof familyDetails === 'string' ? JSON.parse(familyDetails || '{}') : (familyDetails || {});
    const finalFamilyDetails = {
      numberOfFamilyMembers: String(parsedFamily.numberOfFamilyMembers || parsedFamily.members || '1'),
      adults: String(parsedFamily.adults || '1'),
      children: String(parsedFamily.children || '0'),
      maritalStatus: String(parsedFamily.maritalStatus || 'Single'),
    };

    // Parse Occupation Details
    const parsedOccupation = typeof occupationDetails === 'string' ? JSON.parse(occupationDetails || '{}') : (occupationDetails || {});
    const finalOccupationDetails = {
      profession: String(parsedOccupation.profession || ''),
      companyName: String(parsedOccupation.companyName || parsedOccupation.company || ''),
      monthlyIncome: String(parsedOccupation.monthlyIncome || parsedOccupation.income || ''),
    };

    // Parse ID Proof Details (handles file upload if passed in multipart form)
    const parsedIdProof = typeof idProof === 'string' ? JSON.parse(idProof || '{}') : (idProof || {});
    let idProofDocUrl = parsedIdProof.documentUrl || '';
    let idProofOrigName = parsedIdProof.documentOriginalName || '';

    if (req.file) {
      idProofDocUrl = `/uploads/${req.file.filename}`;
      idProofOrigName = req.file.originalname;
    } else if (req.files && req.files.length > 0) {
      idProofDocUrl = `/uploads/${req.files[0].filename}`;
      idProofOrigName = req.files[0].originalname;
    }

    const finalIdProof = {
      idProofType: parsedIdProof.idProofType || 'Aadhaar',
      documentUrl: idProofDocUrl,
      documentOriginalName: idProofOrigName,
    };

    const tokenRequest = await TokenRequest.create({
      property: propertyId,
      client: req.user._id,
      owner: property.owner,
      personalDetails: finalPersonalDetails,
      familyDetails: finalFamilyDetails,
      occupationDetails: finalOccupationDetails,
      idProof: finalIdProof,
      monthlyRent: Number(monthlyRent) || property.price || 0,
      totalAgreedPrice: totalAgreedPrice || `₹${(property.price || 0).toLocaleString('en-IN')}`,
      tokenAmount: numericAmount,
      adjustmentNote: property.tokenAdjustmentNote || "Token amount will be adjusted in security deposit or first month's rent",
      paymentPlanType: selectedPlan,
      installmentPlan: parsedInstallment,
      message: message || '',
      paymentMethod: paymentMethod || 'upi',
      transactionId: transactionId || `UTR-GHARMB-${Date.now()}`,
      paymentStatus: 'paid', // Mark as paid for token reservation
      status: 'pending',
      escrowStatus: 'Escrow Held',
      escrowBank: 'ICICI Escrow Trust #9910',
      utrRef: transactionId || `UTR-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      clientDetails: {
        name: finalPersonalDetails.fullName,
        phone: finalPersonalDetails.mobileNumber,
        email: finalPersonalDetails.email,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days decision window
    });

    // Notify the property owner
    try {
      await Notification.create({
        recipient: property.owner,
        title: 'New Token Booking Request! 💰',
        message: `${finalPersonalDetails.fullName || 'A prospective tenant/buyer'} booked "${property.title}" with a token deposit of ₹${numericAmount.toLocaleString('en-IN')}. Awaiting your decision.`,
        type: 'token_request',
        metadata: {
          propertyId: property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification for token request:', notifErr.message);
    }

    // Increment inquiry/token counter on property
    await Property.findByIdAndUpdate(propertyId, {
      $inc: { inquiriesCount: 1 }
    }).catch(() => {});

    res.status(201).json({
      status: 'success',
      message: 'Token booking submitted successfully! Property reserved in escrow pending owner confirmation.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all token requests received by the logged-in owner/builder
// @route   GET /api/user/token-requests OR GET /api/user/properties/token-requests
// @access  Private (Owner / Builder / Agent)
exports.getReceivedTokenRequests = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { status, propertyId, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const filter = { owner: ownerId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (propertyId) {
      filter.property = propertyId;
    }

    // Counts by status
    const [pendingCount, acceptedCount, rejectedCount, totalCount] = await Promise.all([
      TokenRequest.countDocuments({ owner: ownerId, status: 'pending' }),
      TokenRequest.countDocuments({ owner: ownerId, status: 'accepted' }),
      TokenRequest.countDocuments({ owner: ownerId, status: 'rejected' }),
      TokenRequest.countDocuments({ owner: ownerId }),
    ]);

    const totalFiltered = await TokenRequest.countDocuments(filter);
    const tokenRequests = await TokenRequest.find(filter)
      .populate('property', 'title locality city price propertyType photos images submissionId approvalStatus')
      .populate('client', 'name phone email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequests,
        counts: {
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
          total: totalCount,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalFiltered,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get token requests submitted by the logged-in client / buyer
// @route   GET /api/user/token-requests/my-requests
// @access  Private (Buyer / Client)
exports.getSentTokenRequests = async (req, res, next) => {
  try {
    const clientId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const filter = { client: clientId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const total = await TokenRequest.countDocuments(filter);
    const tokenRequests = await TokenRequest.find(filter)
      .populate('property', 'title locality city price propertyType photos images submissionId')
      .populate('owner', 'name phone email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single token request by ID
// @route   GET /api/user/token-requests/:id
// @access  Private
exports.getTokenRequestById = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id)
      .populate('property')
      .populate('client', 'name phone email profilePicture')
      .populate('owner', 'name phone email companyName');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    // Access control: only owner, client, or admin can view
    const isOwner = tokenRequest.owner?._id?.toString() === req.user._id.toString();
    const isClient = tokenRequest.client?._id?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes((req.user.role || '').toLowerCase());

    if (!isOwner && !isClient && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this token request.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a token request
// @route   PATCH /api/user/token-requests/:id/accept
// @access  Private (Owner / Builder / Agent)
exports.acceptTokenRequest = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id).populate('property', 'title owner');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only accept token requests for your own properties.',
      });
    }

    if (tokenRequest.status === 'accepted') {
      return res.status(400).json({
        status: 'fail',
        message: 'This token request is already accepted.',
        data: { tokenRequest },
      });
    }

    tokenRequest.status = 'accepted';
    tokenRequest.decisionDate = new Date();
    await tokenRequest.save();

    // Increment tokensCount on Property
    await Property.findByIdAndUpdate(tokenRequest.property._id, {
      $inc: { tokensCount: 1 },
    });

    // Notify client
    try {
      await Notification.create({
        recipient: tokenRequest.client,
        title: 'Token Request Accepted! 🎉',
        message: `Your token booking request for "${tokenRequest.property.title}" has been accepted by the owner!`,
        type: 'token_request',
        metadata: {
          propertyId: tokenRequest.property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify client on accept:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Token request accepted successfully.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a token request
// @route   PATCH /api/user/token-requests/:id/reject
// @access  Private (Owner / Builder / Agent)
exports.rejectTokenRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const tokenRequest = await TokenRequest.findById(req.params.id).populate('property', 'title owner');

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only reject token requests for your own properties.',
      });
    }

    tokenRequest.status = 'rejected';
    tokenRequest.rejectionReason = reason || 'Not accepted by owner';
    tokenRequest.decisionDate = new Date();
    await tokenRequest.save();

    // Notify client
    try {
      await Notification.create({
        recipient: tokenRequest.client,
        title: 'Token Request Update',
        message: `Your token request for "${tokenRequest.property.title}" was not accepted: ${tokenRequest.rejectionReason}. Refund processing initiated if applicable.`,
        type: 'token_request',
        metadata: {
          propertyId: tokenRequest.property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify client on reject:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Token request rejected.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending token request by the buyer
// @route   PATCH /api/user/token-requests/:id/cancel
// @access  Private (Buyer / Client)
exports.cancelTokenRequest = async (req, res, next) => {
  try {
    const tokenRequest = await TokenRequest.findById(req.params.id);

    if (!tokenRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Token request not found.',
      });
    }

    if (tokenRequest.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only cancel your own token booking requests.',
      });
    }

    if (tokenRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot cancel a token request that is already ${tokenRequest.status}.`,
      });
    }

    tokenRequest.status = 'cancelled';
    tokenRequest.escrowStatus = 'Refunded';
    tokenRequest.refundDate = new Date();
    await tokenRequest.save();

    res.status(200).json({
      status: 'success',
      message: 'Token booking request cancelled and refund initiated.',
      data: {
        tokenRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};
