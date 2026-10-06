/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles dispatching push notifications to Flutter mobile devices, topics,
 * multi-device broadcasting, and automatic invalid token pruning.
 */

const { messaging } = require('../config/firebase');
const User = require('../models/user.model');
const Admin = require('../models/admin.model');

/**
 * Ensure all values in FCM `data` object are strings (FCM requirement)
 */
const sanitizeData = (raw = {}) => {
  const result = {};
  if (!raw || typeof raw !== 'object') return result;

  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'object') {
      try {
        result[key] = JSON.stringify(value);
      } catch (_) {
        result[key] = String(value);
      }
    } else {
      result[key] = String(value);
    }
  }
  return result;
};

class FcmService {
  /**
   * Check if FCM is available and properly initialized
   */
  isConfigured() {
    return Boolean(messaging);
  }

  /**
   * Send push notification to a single FCM device token
   * @param {Object} options
   * @param {string} options.token - Target FCM registration token
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Object} [options.data] - Additional key-value payload (for Flutter deep linking)
   * @param {string} [options.imageUrl] - Optional image URL for rich notifications
   * @param {string} [options.priority='high'] - 'high' or 'normal'
   * @returns {Promise<{success: boolean, messageId?: string, error?: string, isInvalidToken?: boolean}>}
   */
  async sendToToken({ token, title, body, data = {}, imageUrl = null, priority = 'high' }) {
    if (!this.isConfigured()) {
      console.warn('⚠️ FCM is not configured or initialized. Skipping push.');
      return { success: false, error: 'FCM not initialized' };
    }

    if (!token || typeof token !== 'string' || !token.trim()) {
      return { success: false, error: 'Target token is missing or invalid' };
    }

    const cleanToken = token.trim();
    const cleanData = sanitizeData({
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    });

    const message = {
      token: cleanToken,
      notification: {
        title: title || 'GharMB Notification',
        body: body || '',
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: cleanData,
      android: {
        priority: priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: 'gharmb_notifications',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(imageUrl ? { imageUrl } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
        fcmOptions: imageUrl ? { imageUrl } : undefined,
      },
    };

    try {
      const messageId = await messaging.send(message);
      return { success: true, messageId };
    } catch (err) {
      const isInvalid =
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/invalid-argument';

      if (isInvalid) {
        console.warn(`⚠️ Stale/Invalid FCM token detected: ${cleanToken.substring(0, 15)}... Pruning.`);
        await this.cleanInvalidTokens([cleanToken]);
      } else {
        console.error('❌ FCM sendToToken error:', err.message);
      }

      return {
        success: false,
        error: err.message,
        errorCode: err.code,
        isInvalidToken: isInvalid,
      };
    }
  }

  /**
   * Send push notification to multiple FCM device tokens (Multicast)
   * Chunks tokens into batches of 500 (FCM limit) and handles invalid token pruning.
   */
  async sendToTokens({ tokens = [], title, body, data = {}, imageUrl = null, priority = 'high' }) {
    if (!this.isConfigured()) {
      return { successCount: 0, failureCount: 0, error: 'FCM not initialized' };
    }

    // Filter and deduplicate tokens
    const validTokens = Array.from(new Set(tokens.filter((t) => typeof t === 'string' && t.trim()))).map((t) =>
      t.trim()
    );

    if (validTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const cleanData = sanitizeData({
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    });

    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      const batchTokens = validTokens.slice(i, i + BATCH_SIZE);

      const message = {
        tokens: batchTokens,
        notification: {
          title: title || 'GharMB Notification',
          body: body || '',
          ...(imageUrl ? { imageUrl } : {}),
        },
        data: cleanData,
        android: {
          priority: priority === 'high' ? 'high' : 'normal',
          notification: {
            channelId: 'gharmb_notifications',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            ...(imageUrl ? { imageUrl } : {}),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
          fcmOptions: imageUrl ? { imageUrl } : undefined,
        },
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
              ) {
                invalidTokens.push(batchTokens[idx]);
              }
            }
          });
        }
      } catch (err) {
        console.error('❌ FCM Multicast batch error:', err.message);
        totalFailure += batchTokens.length;
      }
    }

    if (invalidTokens.length > 0) {
      console.log(`🧹 Pruning ${invalidTokens.length} expired FCM tokens from DB.`);
      await this.cleanInvalidTokens(invalidTokens);
    }

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      invalidTokensCount: invalidTokens.length,
    };
  }

  /**
   * Send push notification to a topic (e.g. 'all_users', 'role_buyer', 'announcements')
   */
  async sendToTopic({ topic, title, body, data = {}, imageUrl = null }) {
    if (!this.isConfigured()) {
      return { success: false, error: 'FCM not initialized' };
    }

    if (!topic || typeof topic !== 'string') {
      return { success: false, error: 'Topic is required' };
    }

    const cleanData = sanitizeData({
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    });

    const message = {
      topic: topic.trim().replace(/[^a-zA-Z0-9-_.~%]+/g, '_'),
      notification: {
        title: title || 'GharMB Notification',
        body: body || '',
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: cleanData,
      android: {
        priority: 'high',
        notification: {
          channelId: 'gharmb_notifications',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(imageUrl ? { imageUrl } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    try {
      const messageId = await messaging.send(message);
      return { success: true, messageId };
    } catch (err) {
      console.error(`❌ FCM Topic (${topic}) send error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatch push notification to a specific user by MongoDB User ObjectId
   */
  async sendToUser(userId, { title, body, data = {}, imageUrl = null, priority = 'high' }) {
    try {
      if (!userId) return { successCount: 0, failureCount: 0 };

      const user = await User.findById(userId).select('fcmTokens notificationSettings');
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
      }

      const tokens = user.fcmTokens.map((t) => t.token);
      return await this.sendToTokens({
        tokens,
        title,
        body,
        data,
        imageUrl,
        priority,
      });
    } catch (err) {
      console.error(`❌ FCM sendToUser error for user ${userId}:`, err.message);
      return { successCount: 0, failureCount: 0, error: err.message };
    }
  }

  /**
   * Dispatch push notification to multiple user IDs
   */
  async sendToUsers(userIds = [], { title, body, data = {}, imageUrl = null, priority = 'high' }) {
    try {
      if (!userIds || userIds.length === 0) return { successCount: 0, failureCount: 0 };

      const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
      const allTokens = [];
      users.forEach((u) => {
        if (u.fcmTokens && u.fcmTokens.length > 0) {
          u.fcmTokens.forEach((t) => allTokens.push(t.token));
        }
      });

      return await this.sendToTokens({
        tokens: allTokens,
        title,
        body,
        data,
        imageUrl,
        priority,
      });
    } catch (err) {
      console.error('❌ FCM sendToUsers error:', err.message);
      return { successCount: 0, failureCount: 0, error: err.message };
    }
  }

  /**
   * Dispatch push notification to all Active Admins with registered device tokens
   */
  async sendToAdmins({ title, body, data = {}, imageUrl = null, priority = 'high' }) {
    try {
      const admins = await Admin.find({ isActive: true }).select('fcmTokens');
      const allTokens = [];
      admins.forEach((a) => {
        if (a.fcmTokens && a.fcmTokens.length > 0) {
          a.fcmTokens.forEach((t) => allTokens.push(t.token));
        }
      });

      return await this.sendToTokens({
        tokens: allTokens,
        title,
        body,
        data,
        imageUrl,
        priority,
      });
    } catch (err) {
      console.error('❌ FCM sendToAdmins error:', err.message);
      return { successCount: 0, failureCount: 0, error: err.message };
    }
  }

  /**
   * Remove invalid or expired tokens from database
   */
  async cleanInvalidTokens(invalidTokens = []) {
    if (!invalidTokens || invalidTokens.length === 0) return;

    try {
      await Promise.all([
        User.updateMany(
          { 'fcmTokens.token': { $in: invalidTokens } },
          { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
        ),
        Admin.updateMany(
          { 'fcmTokens.token': { $in: invalidTokens } },
          { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
        ),
      ]);
    } catch (err) {
      console.warn('⚠️ Token cleanup error (non-fatal):', err.message);
    }
  }
}

module.exports = new FcmService();
