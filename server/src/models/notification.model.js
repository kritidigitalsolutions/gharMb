/**
 * Notification Model
 * Handles internal user notifications. Easily expandable for FCM Firebase Push Notifications.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient user.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification must contain a message.'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['enquiry', 'visit_booking', 'property_status', 'verification', 'payment', 'system'],
        message: 'Invalid notification type.',
      },
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Meta object to hold IDs of triggering actions for in-app client navigation
    metadata: {
      propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
      },
      enquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertyEnquiry',
      },
      customLink: String,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
