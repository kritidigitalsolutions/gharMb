/**
 * Admin Visit Request Controller
 * Manages site visit schedules, allowing Administrators to view, accept, decline, or delete requests,
 * and automatically dispatches notifications to the requester and property owner.
 */

const VisitRequest = require('../../models/visit-request.model');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');
const Property = require('../../models/property.model');

// Helper for pagination
const getPagination = (page, limit, defaultLimit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || defaultLimit);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

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

// @desc    Get all visit requests across the platform
// @route   GET /api/admin/visit-requests
// @access  Private (Admin only)
exports.getAllVisitRequests = async (req, res, next) => {
  try {
    const { status, search, propertyId, page = 1, limit = 20 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 20);

    const filter = {};
    if (status && status !== 'all' && status !== 'All') {
      filter.status = status.toLowerCase();
    }
    if (propertyId) {
      filter.property = propertyId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'userDetails.name': regex },
        { 'userDetails.phone': regex },
        { 'userDetails.email': regex },
        { 'propertyDetails.title': regex },
        { 'propertyDetails.locality': regex },
        { 'propertyDetails.city': regex },
        { notes: regex },
      ];
    }

    const validProps = await Property.distinct('_id');
    if (!filter.property) {
      filter.property = { $in: validProps };
    }

    const baseCountFilter = { property: { $in: validProps } };
    const [
      visitRequests,
      totalCount,
      pendingCount,
      acceptedCount,
      rejectedCount,
    ] = await Promise.all([
      VisitRequest.find(filter)
        .populate('property', 'title price locality city carpetArea images submissionId listingFor')
        .populate('user', 'name phone email role profilePicture')
        .populate('owner', 'name phone email role companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      VisitRequest.countDocuments(filter),
      VisitRequest.countDocuments({ ...baseCountFilter, status: 'pending' }),
      VisitRequest.countDocuments({ ...baseCountFilter, status: 'accepted' }),
      VisitRequest.countDocuments({ ...baseCountFilter, status: 'rejected' }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        visitRequests,
        counts: {
          total: totalCount,
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
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

// @desc    Get single visit request details
// @route   GET /api/admin/visit-requests/:id
// @access  Private (Admin only)
exports.getVisitRequestById = async (req, res, next) => {
  try {
    const visitRequest = await VisitRequest.findById(req.params.id)
      .populate('property')
      .populate('user', 'name phone email role profilePicture')
      .populate('owner', 'name phone email role companyName');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
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

// @desc    Admin Accepts a visit request (Notifies user & owner)
// @route   PATCH /api/admin/visit-requests/:id/accept
// @access  Private (Admin only)
exports.acceptVisitRequest = async (req, res, next) => {
  try {
    const visitRequest = await VisitRequest.findById(req.params.id)
      .populate('property', 'title owner locality city');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    const { adminNote, note, notes, message, ownerMessage } = req.body;
    const responseNote = (adminNote || note || notes || ownerMessage || message || '').trim();

    visitRequest.status = 'accepted';
    visitRequest.decisionDate = new Date();
    if (responseNote) {
      visitRequest.ownerMessage = responseNote;
      visitRequest.adminNotes = responseNote;
    }
    await visitRequest.save();

    // 1. Notify user
    try {
      const formattedDate = formatVisitDate(visitRequest.visitDate);
      const propertyTitle = visitRequest.property?.title || 'the property';

      const notifMsg = `Great news! GharMB Admin has accepted and confirmed your scheduled site visit for "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime}.${responseNote ? `\nAdmin Note: "${responseNote}"` : ''}`;

      let targetUser = visitRequest.user?._id || visitRequest.user;
      if (!targetUser && visitRequest.userDetails?.phone) {
        const foundUser = await User.findOne({ phone: visitRequest.userDetails.phone });
        if (foundUser) targetUser = foundUser._id;
      }

      if (targetUser) {
        await Notification.create({
          recipient: targetUser,
          title: 'Visit Request Confirmed! ✅',
          message: notifMsg,
          type: 'visit_booking',
          metadata: {
            propertyId: visitRequest.property?._id || visitRequest.property,
            visitRequestId: visitRequest._id,
            scheduleDetails: {
              date: formattedDate,
              time: visitRequest.visitTime,
            },
          },
        });
      }

      // 2. Notify property owner as informational update
      if (visitRequest.owner) {
        await Notification.create({
          recipient: visitRequest.owner,
          title: 'Site Visit Confirmed by Admin 🗓️',
          message: `GharMB Admin confirmed a scheduled site visit for your listing "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime}. Visitor: ${visitRequest.userDetails?.name || 'Client'} (${visitRequest.userDetails?.phone || 'N/A'}).`,
          type: 'visit_booking',
          metadata: {
            propertyId: visitRequest.property?._id || visitRequest.property,
            visitRequestId: visitRequest._id,
          },
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch notifications on visit request accept:', notifErr.message);
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

// @desc    Admin Declines a visit request (Notifies user & owner)
// @route   PATCH /api/admin/visit-requests/:id/reject
// @access  Private (Admin only)
exports.rejectVisitRequest = async (req, res, next) => {
  try {
    const { adminNote, note, notes, reason, rejectionReason, message } = req.body;
    const finalReason = (adminNote || note || notes || rejectionReason || reason || message || 'Declined by Admin').trim();

    const visitRequest = await VisitRequest.findById(req.params.id)
      .populate('property', 'title owner locality city');

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    if (visitRequest.status === 'rejected') {
      return res.status(400).json({
        status: 'fail',
        message: 'This visit request has already been declined.',
        data: { visitRequest },
      });
    }

    visitRequest.status = 'rejected';
    visitRequest.ownerMessage = finalReason;
    visitRequest.rejectionReason = finalReason;
    visitRequest.decisionDate = new Date();
    await visitRequest.save();

    // 1. Notify user
    try {
      const formattedDate = formatVisitDate(visitRequest.visitDate);
      const propertyTitle = visitRequest.property?.title || 'the property';

      const notifMsg = `Your site visit request for "${propertyTitle}" on ${formattedDate} at ${visitRequest.visitTime} was declined by Admin.\nReason: "${finalReason}"`;

      let targetUser = visitRequest.user?._id || visitRequest.user;
      if (!targetUser && visitRequest.userDetails?.phone) {
        const foundUser = await User.findOne({ phone: visitRequest.userDetails.phone });
        if (foundUser) targetUser = foundUser._id;
      }

      if (targetUser) {
        await Notification.create({
          recipient: targetUser,
          title: 'Visit Request Update ❌',
          message: notifMsg,
          type: 'visit_booking',
          metadata: {
            propertyId: visitRequest.property?._id || visitRequest.property,
            visitRequestId: visitRequest._id,
          },
        });
      }

      // 2. Notify property owner
      if (visitRequest.owner) {
        await Notification.create({
          recipient: visitRequest.owner,
          title: 'Site Visit Request Declined by Admin ❌',
          message: `Visit request for your listing "${propertyTitle}" was declined by Admin. Reason: ${finalReason}`,
          type: 'visit_booking',
          metadata: {
            propertyId: visitRequest.property?._id || visitRequest.property,
            visitRequestId: visitRequest._id,
          },
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch notifications on visit request decline:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Visit request declined successfully. The user has been notified.',
      data: {
        visitRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Deletes a visit request permanently
// @route   DELETE /api/admin/visit-requests/:id
// @access  Private (Admin only)
exports.deleteVisitRequest = async (req, res, next) => {
  try {
    const visitRequest = await VisitRequest.findByIdAndDelete(req.params.id);

    if (!visitRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Visit request not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Visit request deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
