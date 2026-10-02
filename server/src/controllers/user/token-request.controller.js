/**
 * Token Request Controller
 * Handles token booking workflows for real estate properties:
 * - Buyers can submit token booking requests
 * - Owners / Builders / Agents can view received token requests, accept, or reject them
 * - Updates property counters and triggers in-app notifications
 */

const TokenRequest = require('../../models/token-request.model');
const Property = require('../../models/property.model');
const Notification = require('../../models/notification.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// @desc    Submit a new Token Booking Request for a property
// @route   POST /api/user/token-requests OR POST /api/properties/:id/token-request
// @access  Private (Buyer / Client)
exports.createTokenRequest = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.body.property || req.body.propertyId;
    const { tokenAmount, message, paymentMethod, transactionId } = req.body;

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
    if (property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit a token request for your own property listing.',
      });
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

    const numericAmount = Number(tokenAmount) || 21000;

    const tokenRequest = await TokenRequest.create({
      property: propertyId,
      client: req.user._id,
      owner: property.owner,
      tokenAmount: numericAmount,
      message: message || '',
      paymentMethod: paymentMethod || 'upi',
      transactionId: transactionId || '',
      paymentStatus: 'paid', // Mark as paid for token reservation
      status: 'pending',
      clientDetails: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days decision window
    });

    // Notify the property owner
    try {
      await Notification.create({
        recipient: property.owner,
        title: 'New Token Request Received! 💰',
        message: `${req.user.name || 'A buyer'} submitted a token request of ₹${numericAmount.toLocaleString('en-IN')} for ${property.title}. Awaiting your decision.`,
        type: 'token_request',
        metadata: {
          propertyId: property._id,
          tokenRequestId: tokenRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification for token request:', notifErr.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Token request submitted successfully. The property owner will review it shortly.',
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
      .populate('property', 'title locality city price propertyType photos submissionId approvalStatus')
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
      .populate('property', 'title locality city price propertyType photos submissionId')
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
        message: `Your token request for "${tokenRequest.property.title}" was rejected: ${tokenRequest.rejectionReason}. Refund processing initiated if applicable.`,
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
