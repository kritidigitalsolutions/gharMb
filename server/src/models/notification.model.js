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
        values: ['enquiry', 'visit_booking', 'property_status', 'verification', 'payment', 'token_request', 'service_enquiry', 'property_sale', 'system'],
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
      serviceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
      },
      serviceRequestRef: String,
      serviceType: String,
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
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
      developerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      customLink: String,
      broadcastId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Broadcast',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Post-save hook: automatically dispatch FCM push notifications
notificationSchema.post('save', function (doc) {
  // Prevent duplicate dispatch if already handled by helper
  if (doc._fcmDispatched) return;

  try {
    const fcmService = require('../services/fcm.service');
    if (doc.recipient && !doc.forAdmin) {
      fcmService
        .sendToUser(doc.recipient, {
          title: doc.title,
          body: doc.message,
          data: {
            notificationId: doc._id.toString(),
            type: doc.type || 'system',
            ...(doc.metadata ? (typeof doc.metadata.toObject === 'function' ? doc.metadata.toObject() : doc.metadata) : {}),
          },
        })
        .catch((e) => console.warn('⚠️ FCM notification hook user dispatch notice:', e.message));
    } else if (doc.forAdmin) {
      fcmService
        .sendToAdmins({
          title: doc.title,
          body: doc.message,
          data: {
            notificationId: doc._id.toString(),
            type: doc.type || 'system',
            forAdmin: 'true',
            ...(doc.metadata ? (typeof doc.metadata.toObject === 'function' ? doc.metadata.toObject() : doc.metadata) : {}),
          },
        })
        .catch((e) => console.warn('⚠️ FCM notification hook admin dispatch notice:', e.message));
    }
  } catch (err) {
    console.warn('⚠️ FCM notification post-save hook notice:', err.message);
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
