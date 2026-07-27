/**
 * Admin Notification Controller
 * Allows administrators to broadcast notifications and alerts to platform users.
 */

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

// @desc    Get all notifications (historical log)
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
exports.getNotificationLogs = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email');

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};
