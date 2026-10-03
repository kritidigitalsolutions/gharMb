/**
 * Visit Request Controller
 * Handles property and site visit scheduling workflows:
 * - Users can schedule visit requests with preferred date & time
 * - System notifies property owner with visit & user details
 * - Property owners can view received visit requests
 * - Property owners can accept or reject requests (with rejection messages/next available schedule)
 * - Users receive notification updates when owner accepts or rejects
 */

const VisitRequest = require('../../models/visit-request.model');
const Property = require('../../models/property.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

// Helper to format date cleanly for notifications
const formatVisitDate = (dateVal) => {
  try {
    return new Date(dateVal).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return new Date(dateVal).toISOString().slice(0, 10);
  }
};

// @desc    Schedule a new Property / Site Visit Request
// @route   POST /api/user/visit-requests OR POST /api/visit-requests OR POST /api/properties/:id/visit-request
// @access  Private (User / Visitor)
exports.createVisitRequest = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.body.property || req.body.propertyId;
    const { visitDate, visitTime, notes, message } = req.body;

    // 1. Validate property ID
    if (!propertyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Property ID is required to schedule a visit.',
      });
    }

    // 2. Validate property existence
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
    }

    // 3. Verify property owner account exists in app
    if (!property.owner) {
      return res.status(400).json({
        status: 'fail',
        message: 'This property does not have an assigned owner.',
      });
    }

    const ownerUser = await User.findById(property.owner);
    if (!ownerUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'The property owner must have an active account in the app to receive and manage visit requests.',
      });
    }

    // 4. Owner cannot schedule a visit to their own property
    if (property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot schedule a visit for your own property listing.',
      });
    }

    // 5. Validate visit date and time
    if (!visitDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select a date for your visit.',
      });
    }

    if (!visitTime || !visitTime.toString().trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select a time or slot for your visit.',
      });
    }

    const parsedDate = new Date(visitDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid visit date format. Please provide a valid date.',
      });
    }

    // 6. Check if user already has an active pending visit request for this property
    const existingPending = await VisitRequest.findOne({
      property: property._id,
      user: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have a pending visit request for this property.',
        data: { visitRequest: existingPending },
      });
    }

    // 7. Create the visit request record maintaining user, property, owner, date/time, and status
    const userNotes = notes || message || '';
    const formattedDateStr = formatVisitDate(parsedDate);
    const cleanedVisitTime = visitTime.toString().trim();

    const visitRequest = await VisitRequest.create({
      property: property._id,
      user: req.user._id,
      owner: property.owner,
      visitDate: parsedDate,
      visitTime: cleanedVisitTime,
      notes: userNotes,
      status: 'pending',
      userDetails: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
      },
      propertyDetails: {
        title: property.title,
        locality: property.locality,
        city: property.city,
        fullAddress: property.fullAddress,
      },
    });

    // 8. Send notification to the property owner containing full visit & visitor details
    try {
      const userContact = [
        req.user.name ? `Name: ${req.user.name}` : '',
        req.user.phone ? `Phone: ${req.user.phone}` : '',
        req.user.email ? `Email: ${req.user.email}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const propertyLocation = [property.locality, property.city].filter(Boolean).join(', ');

      const notificationMessage = `New site visit request received for "${property.title}"${propertyLocation ? ` (${propertyLocation})` : ''}.\nRequested Date: ${formattedDateStr}\nRequested Time: ${cleanedVisitTime}\nVisitor: ${userContact}${userNotes ? `\nNote: ${userNotes}` : ''}`;

      await Notification.create({
        recipient: property.owner,
        title: 'New Site Visit Request 🗓️',
        message: notificationMessage,
        type: 'visit_booking',
        metadata: {
          propertyId: property._id,
          visitRequestId: visitRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification for property owner:', notifErr.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Property visit request scheduled successfully. The property owner has been notified.',
      data: {
        visitRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all visit requests received by the logged-in property owner
// @route   GET /api/user/visit-requests OR GET /api/visit-requests
// @access  Private (Owner / Property lister)
exports.getReceivedVisitRequests = async (req, res, next) => {
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

    // Counts summary by status for owner dashboard tabs
    const [pendingCount, acceptedCount, rejectedCount, totalCount] = await Promise.all([
      VisitRequest.countDocuments({ owner: ownerId, status: 'pending' }),
      VisitRequest.countDocuments({ owner: ownerId, status: 'accepted' }),
      VisitRequest.countDocuments({ owner: ownerId, status: 'rejected' }),
      VisitRequest.countDocuments({ owner: ownerId }),
    ]);

    const totalFiltered = await VisitRequest.countDocuments(filter);
    const visitRequests = await VisitRequest.find(filter)
      .populate('property', 'title locality city fullAddress price propertyType images submissionId approvalStatus')
      .populate('user', 'name phone email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        visitRequests,
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

// @desc    Get all visit requests submitted by the logged-in user (My Visits)
// @route   GET /api/user/visit-requests/my-visits OR GET /api/visit-requests/my-requests
// @access  Private (User / Visitor)
exports.getUserVisitRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const filter = { user: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [pendingCount, acceptedCount, rejectedCount, totalCount] = await Promise.all([
      VisitRequest.countDocuments({ user: userId, status: 'pending' }),
      VisitRequest.countDocuments({ user: userId, status: 'accepted' }),
      VisitRequest.countDocuments({ user: userId, status: 'rejected' }),
      VisitRequest.countDocuments({ user: userId }),
    ]);

    const totalFiltered = await VisitRequest.countDocuments(filter);
    const visitRequests = await VisitRequest.find(filter)
      .populate('property', 'title locality city fullAddress price propertyType images submissionId')
      .populate('owner', 'name phone email companyName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        visitRequests,
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

// @desc    Get single visit request details by ID
// @route   GET /api/user/visit-requests/:id OR GET /api/visit-requests/:id
// @access  Private (Owner, Requester, or Admin)
exports.getVisitRequestById = async (req, res, next) => {
  try {
    const visitRequest = await VisitRequest.findById(req.params.id)
      .populate('property')
      .populate('user', 'name phone email profilePicture')
      .populate('owner', 'name phone email companyName profilePicture');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    const isOwner = visitRequest.owner?._id?.toString() === req.user._id.toString();
    const isUser = visitRequest.user?._id?.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes((req.user.role || '').toLowerCase());

    if (!isOwner && !isUser && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this visit request.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        visitRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a visit request
// @route   PATCH /api/user/visit-requests/:id/accept OR PATCH /api/visit-requests/:id/accept
// @access  Private (Property Owner)
exports.acceptVisitRequest = async (req, res, next) => {
  try {
    const visitRequest = await VisitRequest.findById(req.params.id).populate('property', 'title owner locality city');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    // Only property owner can accept
    if (visitRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only accept visit requests for your own property listings.',
      });
    }

    if (visitRequest.status === 'accepted') {
      return res.status(400).json({
        status: 'fail',
        message: 'This visit request has already been accepted.',
        data: { visitRequest },
      });
    }

    const { message, ownerMessage } = req.body;
    const responseNote = (ownerMessage || message || '').trim();

    visitRequest.status = 'accepted';
    visitRequest.decisionDate = new Date();
    if (responseNote) {
      visitRequest.ownerMessage = responseNote;
    }
    await visitRequest.save();

    // Notify the user that the owner has accepted the request
    try {
      const formattedDate = formatVisitDate(visitRequest.visitDate);
      const propertyTitle = visitRequest.property?.title || 'the property';

      const notifMsg = `Great news! The owner has accepted your scheduled visit for "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime}.${responseNote ? `\nOwner Note: "${responseNote}"` : ''}`;

      await Notification.create({
        recipient: visitRequest.user,
        title: 'Visit Request Confirmed! ✅',
        message: notifMsg,
        type: 'visit_booking',
        metadata: {
          propertyId: visitRequest.property?._id || visitRequest.property,
          visitRequestId: visitRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify user on visit request accept:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Visit request accepted successfully. The user has been notified.',
      data: {
        visitRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a visit request with owner message / alternative schedule
// @route   PATCH /api/user/visit-requests/:id/reject OR PATCH /api/visit-requests/:id/reject
// @access  Private (Property Owner)
exports.rejectVisitRequest = async (req, res, next) => {
  try {
    const { message, ownerMessage, reason, rejectionReason } = req.body;
    const finalRejectionMessage = (ownerMessage || message || rejectionReason || reason || '').trim();

    const visitRequest = await VisitRequest.findById(req.params.id).populate('property', 'title owner locality city');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    // Only property owner can reject
    if (visitRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only reject visit requests for your own property listings.',
      });
    }

    if (visitRequest.status === 'rejected') {
      return res.status(400).json({
        status: 'fail',
        message: 'This visit request has already been rejected.',
        data: { visitRequest },
      });
    }

    visitRequest.status = 'rejected';
    visitRequest.ownerMessage = finalRejectionMessage;
    visitRequest.rejectionReason = finalRejectionMessage || 'Declined by owner';
    visitRequest.decisionDate = new Date();
    await visitRequest.save();

    // Notify user with the owner's rejection message & reason / next available schedule
    try {
      const formattedDate = formatVisitDate(visitRequest.visitDate);
      const propertyTitle = visitRequest.property?.title || 'the property';

      const notifMsg = finalRejectionMessage
        ? `Your visit request for "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime} was declined by the owner.\nOwner Message: "${finalRejectionMessage}"`
        : `Your visit request for "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime} was declined by the owner.`;

      await Notification.create({
        recipient: visitRequest.user,
        title: 'Visit Request Update ❌',
        message: notifMsg,
        type: 'visit_booking',
        metadata: {
          propertyId: visitRequest.property?._id || visitRequest.property,
          visitRequestId: visitRequest._id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify user on visit request rejection:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Visit request rejected successfully. The owner message has been sent to the user.',
      data: {
        visitRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};
