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
      required: false,
      index: true,
    },
    forAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
        values: ['enquiry', 'visit_booking', 'property_status', 'verification', 'payment', 'token_request', 'system'],
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
      tokenRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TokenRequest',
      },
      visitRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VisitRequest',
      },
      clientDetails: {
        name: String,
        phone: String,
        email: String,
      },
      scheduleDetails: {
        date: String,
        time: String,
      },
      agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reraNumber: String,
      customLink: String,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
