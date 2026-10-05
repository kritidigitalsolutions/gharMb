/**
 * Admin Notification Helper
 * Provides unified helper functions to dispatch notifications directly to Admin and users.
 */

const Notification = require('../models/notification.model');
const User = require('../models/user.model');

/**
 * Dispatch an in-app notification directly to the Admin notification panel.
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message body
 * @param {string} [options.type='enquiry'] - Notification type ('enquiry' | 'visit_booking' | 'token_request' | 'system' | 'verification' | 'payment')
 * @param {Object} [options.metadata={}] - Metadata references (propertyId, enquiryId, visitRequestId, clientDetails, scheduleDetails, etc.)
 * @param {string|mongoose.Types.ObjectId} [options.senderId] - User ID of who triggered the enquiry/schedule
 * @returns {Promise<Notification|null>}
 */
exports.notifyAdmin = async ({ title, message, type = 'enquiry', metadata = {}, senderId = null }) => {
  try {
    // Optionally resolve an admin user if present in User collection or Admin collection
    let adminRecipient = null;
    try {
      const adminUser = await User.findOne({
        role: { $in: ['admin', 'superadmin'] }
      }).select('_id');
      if (adminUser) {
        adminRecipient = adminUser._id;
      } else {
        const Admin = require('../models/admin.model');
        const adminDoc = await Admin.findOne().select('_id');
        if (adminDoc) {
          adminRecipient = adminDoc._id;
        }
      }
    } catch (_) {}

    const notification = await Notification.create({
      recipient: adminRecipient,
      forAdmin: true,
      sender: senderId || undefined,
      title,
      message,
      type,
      metadata: {
        ...metadata,
      },
      isRead: false,
    });

    return notification;
  } catch (err) {
    console.error('Error dispatching admin notification:', err.message);
    return null;
  }
};

/**
 * Dispatch a notification to a specific user (e.g. property owner, tenant, etc.)
 */
exports.notifyUser = async ({ recipientId, title, message, type = 'system', metadata = {}, senderId = null }) => {
  try {
    if (!recipientId) return null;

    const notification = await Notification.create({
      recipient: recipientId,
      forAdmin: false,
      sender: senderId || undefined,
      title,
      message,
      type,
      metadata,
      isRead: false,
    });

    return notification;
  } catch (err) {
    console.error('Error dispatching user notification:', err.message);
    return null;
  }
};
