/**
 * App Notification Controller
 * Manages user inbox alerts and updates.
 */

const mongoose = require('mongoose');
const Notification = require('../../models/notification.model');

// @desc    Retrieve notifications for the current user
// @route   GET /api/user/notifications
// @access  Private
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('metadata.propertyId', 'title price images');

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

// @desc    Mark notification as read
// @route   PATCH /api/user/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or access denied.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all of current user's notifications as read
// @route   POST /api/user/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific notification for the current user
// @route   DELETE /api/notifications/:id or DELETE /api/user/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or access denied.',
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

// @desc    Delete all notifications for the current user (Clear all)
// @route   DELETE /api/notifications or DELETE /api/notifications/clear-all
// @access  Private
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });

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
