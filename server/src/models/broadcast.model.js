const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Broadcast must have a title/subject.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Broadcast must have a message body.'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['system', 'announcement', 'update', 'alert', 'promotional'],
      default: 'system',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'role', 'specific'],
      default: 'all',
    },
    targetRole: {
      type: String,
      enum: ['buyer', 'tenant', 'owner', 'agent', 'builder', null, ''],
      default: null,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    actionUrl: {
      type: String,
      trim: true,
      default: '',
    },
    actionLabel: {
      type: String,
      trim: true,
      default: '',
    },
    senderAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    senderEmail: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'draft', 'scheduled'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ targetAudience: 1, type: 1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);
