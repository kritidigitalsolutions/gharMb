/**
 * Admin Broadcast Controller
 * Comprehensive management of platform-wide and targeted broadcast messages.
 */

const mongoose = require('mongoose');
const Broadcast = require('../../models/broadcast.model');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');
const fcmService = require('../../services/fcm.service');

// @desc    Get all broadcasts with filters, search, pagination, and KPI metrics
// @route   GET /api/admin/broadcasts
// @access  Private (Admin only)
exports.getBroadcasts = async (req, res, next) => {
  try {
    const {
      search,
      type,
      targetAudience,
      targetRole,
      priority,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (targetAudience && targetAudience !== 'all') {
      filter.targetAudience = targetAudience;
    }

    if (targetRole && targetRole !== 'all') {
      filter.targetRole = targetRole;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { message: regex },
        { actionLabel: regex },
        { actionUrl: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [broadcasts, totalFiltered, allStatsAgg] = await Promise.all([
      Broadcast.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('targetUser', 'name email phone role avatar')
        .populate('senderAdmin', 'name email'),
      Broadcast.countDocuments(filter),
      Broadcast.aggregate([
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalReached: { $sum: '$recipientCount' },
            announcements: { $sum: { $cond: [{ $eq: ['$type', 'announcement'] }, 1, 0] } },
            system: { $sum: { $cond: [{ $eq: ['$type', 'system'] }, 1, 0] } },
            updates: { $sum: { $cond: [{ $eq: ['$type', 'update'] }, 1, 0] } },
            alerts: { $sum: { $cond: [{ $eq: ['$type', 'alert'] }, 1, 0] } },
            promotional: { $sum: { $cond: [{ $eq: ['$type', 'promotional'] }, 1, 0] } },
            audienceAll: { $sum: { $cond: [{ $eq: ['$targetAudience', 'all'] }, 1, 0] } },
            audienceRole: { $sum: { $cond: [{ $eq: ['$targetAudience', 'role'] }, 1, 0] } },
            audienceSpecific: { $sum: { $cond: [{ $eq: ['$targetAudience', 'specific'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = allStatsAgg[0] || {
      totalCount: 0,
      totalReached: 0,
      announcements: 0,
      system: 0,
      updates: 0,
      alerts: 0,
      promotional: 0,
      audienceAll: 0,
      audienceRole: 0,
      audienceSpecific: 0,
    };

    // Calculate total active registered users on platform for reference
    const totalPlatformUsers = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      results: broadcasts.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limitNum) || 1,
      },
      stats: {
        totalBroadcasts: stats.totalCount,
        totalReached: stats.totalReached,
        totalPlatformUsers,
        typeBreakdown: {
          announcement: stats.announcements,
          system: stats.system,
          update: stats.updates,
          alert: stats.alerts,
          promotional: stats.promotional,
        },
        audienceBreakdown: {
          all: stats.audienceAll,
          role: stats.audienceRole,
          specific: stats.audienceSpecific,
        },
      },
      data: {
        broadcasts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audience recipient count estimate in real time
// @route   GET /api/admin/broadcasts/audience-estimate
// @access  Private (Admin only)
exports.getAudienceEstimate = async (req, res, next) => {
  try {
    const { targetAudience, targetRole, targetUserId } = req.query;

    let estimate = 0;

    if (targetAudience === 'specific') {
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
        const user = await User.findById(targetUserId).select('_id');
        estimate = user ? 1 : 0;
      } else {
        estimate = 0;
      }
    } else if (targetAudience === 'role') {
      if (targetRole) {
        estimate = await User.countDocuments({ role: targetRole });
      } else {
        estimate = 0;
      }
    } else {
      // Default: all platform users
      estimate = await User.countDocuments();
    }

    res.status(200).json({
      status: 'success',
      data: {
        estimate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispatch a new broadcast message
// @route   POST /api/admin/broadcasts
// @access  Private (Admin only)
exports.createBroadcast = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = 'system',
      priority = 'normal',
      targetAudience = 'all',
      targetRole,
      targetUserId,
      actionUrl,
      actionLabel,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Broadcast title / subject is required.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Broadcast message body is required.',
      });
    }

    // Resolve target recipients
    let recipients = [];

    if (targetAudience === 'specific') {
      if (!targetUserId) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please specify a target recipient user.',
        });
      }
      const targetUser = await User.findById(targetUserId).select('_id name email role');
      if (!targetUser) {
        return res.status(404).json({
          status: 'fail',
          message: 'Target recipient user was not found.',
        });
      }
      recipients = [targetUser];
    } else if (targetAudience === 'role') {
      if (!targetRole) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please specify a target user role (buyer, agent, builder, owner, tenant).',
        });
      }
      recipients = await User.find({ role: targetRole }).select('_id');
    } else {
      // All platform users
      recipients = await User.find().select('_id');
    }

    const senderAdminId = req.user?._id || null;
    const senderEmail = req.user?.email || 'admin@gharmb.com';

    // 1. Create Broadcast entry
    const broadcast = await Broadcast.create({
      title: title.trim(),
      message: message.trim(),
      type: ['system', 'announcement', 'update', 'alert', 'promotional'].includes(type) ? type : 'system',
      priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
      targetAudience,
      targetRole: targetAudience === 'role' ? targetRole : null,
      targetUser: targetAudience === 'specific' ? targetUserId : null,
      recipientCount: recipients.length,
      actionUrl: actionUrl ? actionUrl.trim() : '',
      actionLabel: actionLabel ? actionLabel.trim() : '',
      senderAdmin: senderAdminId,
      senderEmail,
      status: 'sent',
    });

    // 2. Dispatch notifications to users
    if (recipients.length > 0) {
      const notifType = ['enquiry', 'visit_booking', 'property_status', 'verification', 'payment', 'token_request', 'service_enquiry', 'system'].includes(type)
        ? type
        : 'system';

      const notificationsData = recipients.map((user) => ({
        recipient: user._id,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        metadata: {
          customLink: actionUrl ? actionUrl.trim() : undefined,
          broadcastId: broadcast._id,
        },
      }));

      await Notification.insertMany(notificationsData);

      // Asynchronously trigger FCM push notifications to all target users
      const recipientIds = recipients.map((u) => u._id);
      fcmService
        .sendToUsers(recipientIds, {
          title: title.trim(),
          body: message.trim(),
          priority: priority === 'urgent' || priority === 'high' ? 'high' : 'normal',
          data: {
            broadcastId: broadcast._id.toString(),
            type: 'broadcast',
            actionUrl: actionUrl ? actionUrl.trim() : '',
            priority: priority || 'normal',
          },
        })
        .catch((pushErr) => {
          console.warn('⚠️ Broadcast FCM push notification dispatch notice:', pushErr.message);
        });
    }

    const populatedBroadcast = await Broadcast.findById(broadcast._id)
      .populate('targetUser', 'name email phone role avatar')
      .populate('senderAdmin', 'name email');

    res.status(201).json({
      status: 'success',
      message: `Broadcast dispatched successfully to ${recipients.length} platform ${recipients.length === 1 ? 'user' : 'users'}.`,
      data: {
        broadcast: populatedBroadcast,
        recipientsCount: recipients.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single broadcast by ID
// @route   GET /api/admin/broadcasts/:id
// @access  Private (Admin only)
exports.getBroadcastById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid broadcast ID format.',
      });
    }

    const broadcast = await Broadcast.findById(id)
      .populate('targetUser', 'name email phone role avatar')
      .populate('senderAdmin', 'name email');

    if (!broadcast) {
      return res.status(404).json({
        status: 'fail',
        message: 'Broadcast not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        broadcast,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a broadcast and retract notifications
// @route   DELETE /api/admin/broadcasts/:id
// @access  Private (Admin only)
exports.deleteBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid broadcast ID format.',
      });
    }

    const broadcast = await Broadcast.findByIdAndDelete(id);

    if (!broadcast) {
      return res.status(404).json({
        status: 'fail',
        message: 'Broadcast not found.',
      });
    }

    // Clean up notifications generated from this broadcast
    const deleteResult = await Notification.deleteMany({
      'metadata.broadcastId': broadcast._id,
    });

    res.status(200).json({
      status: 'success',
      message: `Broadcast removed and retracted from ${deleteResult.deletedCount} user notifications.`,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend an existing broadcast to its target audience
// @route   POST /api/admin/broadcasts/:id/resend
// @access  Private (Admin only)
exports.resendBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid broadcast ID format.',
      });
    }

    const original = await Broadcast.findById(id);
    if (!original) {
      return res.status(404).json({
        status: 'fail',
        message: 'Original broadcast not found.',
      });
    }

    // Resolve recipients again
    let recipients = [];
    if (original.targetAudience === 'specific') {
      const u = await User.findById(original.targetUser).select('_id');
      if (u) recipients = [u];
    } else if (original.targetAudience === 'role') {
      recipients = await User.find({ role: original.targetRole }).select('_id');
    } else {
      recipients = await User.find().select('_id');
    }

    // Create a new duplicate broadcast record marking it as resent
    const resentBroadcast = await Broadcast.create({
      title: original.title,
      message: original.message,
      type: original.type,
      priority: original.priority,
      targetAudience: original.targetAudience,
      targetRole: original.targetRole,
      targetUser: original.targetUser,
      recipientCount: recipients.length,
      actionUrl: original.actionUrl,
      actionLabel: original.actionLabel,
      senderAdmin: req.user?._id || original.senderAdmin,
      senderEmail: req.user?.email || original.senderEmail,
      status: 'sent',
    });

    if (recipients.length > 0) {
      const notifType = ['enquiry', 'visit_booking', 'property_status', 'verification', 'payment', 'token_request', 'service_enquiry', 'system'].includes(original.type)
        ? original.type
        : 'system';

      const notificationsData = recipients.map((user) => ({
        recipient: user._id,
        title: original.title,
        message: original.message,
        type: notifType,
        metadata: {
          customLink: original.actionUrl || undefined,
          broadcastId: resentBroadcast._id,
        },
      }));

      await Notification.insertMany(notificationsData);
    }

    const populated = await Broadcast.findById(resentBroadcast._id)
      .populate('targetUser', 'name email phone role avatar')
      .populate('senderAdmin', 'name email');

    res.status(201).json({
      status: 'success',
      message: `Broadcast re-dispatched to ${recipients.length} platform users.`,
      data: {
        broadcast: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};
