/**
 * Admin Notification Controller
 * Allows administrators to broadcast notifications and alerts to platform users.
 */

const mongoose = require('mongoose');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');

// @desc    Broadcast a system-wide or targeted notification
// @route   POST /api/admin/notifications
// @access  Private (Admin only)
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { recipientId, title, message, type } = req.body;

    if (recipientId) {
      // Send to a single user
      const targetUser = await User.findById(recipientId);
      if (!targetUser) {
        return res.status(404).json({
          status: 'fail',
          message: 'Recipient user not found.',
        });
      }

      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type: type || 'system',
      });

      return res.status(201).json({
        status: 'success',
        data: {
          notification,
        },
      });
    } else {
      // Broadcast to all active users
      const users = await User.find().select('_id');
      const notificationsData = users.map((user) => ({
        recipient: user._id,
        title,
        message,
        type: type || 'system',
      }));

      // Bulk insert notifications
      const notifications = await Notification.insertMany(notificationsData);

      return res.status(201).json({
        status: 'success',
        message: `Notification broadcasted to ${notifications.length} users successfully.`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notifications (historical log with deep population and stats)
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
exports.getNotificationLogs = async (req, res, next) => {
  try {
    const { type, isRead, search, limit } = req.query;

    const filter = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (isRead !== undefined && isRead !== 'all') {
      filter.isRead = isRead === 'true' || isRead === true;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { message: regex },
        { 'metadata.clientDetails.name': regex },
        { 'metadata.clientDetails.phone': regex },
        { 'metadata.clientDetails.email': regex },
      ];
    }

    const Admin = require('../../models/admin.model');
    const [validUserIds, validAdminIds] = await Promise.all([
      User.distinct('_id'),
      Admin.distinct('_id'),
    ]);
    const validRecipientIds = [...validUserIds, ...validAdminIds];

    const recipientOrClause = [
      { recipient: { $in: validRecipientIds } },
      { forAdmin: true },
      { recipient: null },
    ];

    if (!filter.$or) {
      filter.$or = recipientOrClause;
    } else {
      filter.$and = [{ $or: filter.$or }, { $or: recipientOrClause }];
      delete filter.$or;
    }

    const query = Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email phone role avatar')
      .populate('sender', 'name email phone avatar')
      .populate({
        path: 'metadata.propertyId',
        select: 'title price locality city carpetArea images propertyImages listingTier propertyType submissionId listingFor'
      })
      .populate({
        path: 'metadata.enquiryId',
        select: 'message status visitPreferredDate visitTimeSlot clientDetails createdAt'
      })
      .populate({
        path: 'metadata.visitRequestId',
        select: 'visitDate visitTime notes status userDetails propertyDetails'
      })
      .populate({
        path: 'metadata.tokenRequestId',
        select: 'tokenAmount tokenRequestId status personalDetails clientDetails paymentPlanType'
      })
      .populate({
        path: 'metadata.agentId',
        select: 'name email phone role reraNumber experience cityOfOperation verificationDocs agentVerificationStatus agentRejectionReason profilePicture isVerified createdAt'
      });

    if (limit && parseInt(limit, 10) > 0) {
      query.limit(parseInt(limit, 10));
    }

    const notifications = await query;

    // Concurrently aggregate counts for top KPI cards and tab badges
    const baseCountFilter = { $or: recipientOrClause };
    const [
      totalCount,
      unreadCount,
      enquiriesCount,
      visitsCount,
      tokensCount,
      verificationsCount,
      systemCount
    ] = await Promise.all([
      Notification.countDocuments(baseCountFilter),
      Notification.countDocuments({ ...baseCountFilter, isRead: false }),
      Notification.countDocuments({ ...baseCountFilter, type: 'enquiry' }),
      Notification.countDocuments({ ...baseCountFilter, type: 'visit_booking' }),
      Notification.countDocuments({ ...baseCountFilter, type: 'token_request' }),
      Notification.countDocuments({ ...baseCountFilter, type: 'verification' }),
      Notification.countDocuments({ ...baseCountFilter, type: 'system' }),
    ]);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      counts: {
        total: totalCount,
        unread: unreadCount,
        enquiries: enquiriesCount,
        visits: visitsCount,
        tokens: tokensCount,
        verifications: verificationsCount,
        system: systemCount,
      },
      data: {
        notifications,
        counts: {
          total: totalCount,
          unread: unreadCount,
          enquiries: enquiriesCount,
          visits: visitsCount,
          tokens: tokensCount,
          verifications: verificationsCount,
          system: systemCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read or toggle status
// @route   PATCH /api/admin/notifications/:id/read
// @access  Private (Admin only)
exports.markNotificationRead = async (req, res, next) => {
  try {
    const targetStatus = typeof req.body.isRead === 'boolean' ? req.body.isRead : true;

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: targetStatus },
      { new: true }
    )
      .populate('recipient', 'name email phone')
      .populate('sender', 'name email phone')
      .populate({
        path: 'metadata.propertyId',
        select: 'title price locality city images'
      });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: targetStatus ? 'Marked as read.' : 'Marked as unread.',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/admin/notifications/mark-all-read
// @access  Private (Admin only)
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ isRead: false }, { isRead: true });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification by ID (Admin)
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin only)
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all notifications (Admin Clear All)
// @route   DELETE /api/admin/notifications/clear-all
// @access  Private (Admin only)
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({});

    res.status(200).json({
      status: 'success',
      message: 'All notifications deleted successfully.',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

