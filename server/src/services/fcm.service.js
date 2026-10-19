/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles dispatching push notifications to Flutter mobile devices (Android/iOS),
 * Web clients, FCM topics, and role-based audience broadcasting.
 */

const mongoose = require('mongoose');
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
          color: '#FF5A3C',
          defaultSound: true,
          defaultVibrateTimings: true,
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
            alert: {
              title: title || 'GharMB Notification',
              body: body || '',
            },
          },
        },
        fcmOptions: imageUrl ? { imageUrl } : undefined,
      },
      webpush: {
        headers: {
          Urgency: priority === 'high' ? 'high' : 'normal',
        },
        notification: {
          title: title || 'GharMB Notification',
          body: body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcmOptions: {
          link: data.link || data.url || '/',
        },
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
            color: '#FF5A3C',
            defaultSound: true,
            defaultVibrateTimings: true,
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
              alert: {
                title: title || 'GharMB Notification',
                body: body || '',
              },
            },
          },
          fcmOptions: imageUrl ? { imageUrl } : undefined,
        },
        webpush: {
          headers: {
            Urgency: priority === 'high' ? 'high' : 'normal',
          },
          notification: {
            title: title || 'GharMB Notification',
            body: body || '',
            icon: '/logo.png',
            badge: '/logo.png',
            ...(imageUrl ? { image: imageUrl } : {}),
          },
          fcmOptions: {
            link: data.link || data.url || '/',
          },
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
   * Send push notification to an FCM topic (e.g. 'all_users', 'role_buyer', 'announcements')
   */
  async sendToTopic({ topic, title, body, data = {}, imageUrl = null, priority = 'high' }) {
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

    const cleanTopic = topic.trim().replace(/[^a-zA-Z0-9-_.~%]+/g, '_');

    const message = {
      topic: cleanTopic,
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
          color: '#FF5A3C',
          defaultSound: true,
          defaultVibrateTimings: true,
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
            alert: {
              title: title || 'GharMB Notification',
              body: body || '',
            },
          },
        },
        fcmOptions: imageUrl ? { imageUrl } : undefined,
      },
      webpush: {
        headers: {
          Urgency: priority === 'high' ? 'high' : 'normal',
        },
        notification: {
          title: title || 'GharMB Notification',
          body: body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcmOptions: {
          link: data.link || data.url || '/',
        },
      },
    };

    try {
      const messageId = await messaging.send(message);
      return { success: true, messageId };
    } catch (err) {
      console.error(`❌ FCM Topic (${cleanTopic}) send error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Subscribe device token(s) to an FCM topic
   * @param {string|string[]} tokens - Token or array of tokens
   * @param {string} topic - Topic name
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.isConfigured() || !tokens || !topic) {
      return { success: false, error: 'FCM not ready or missing parameters' };
    }
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];
    const cleanTopic = topic.trim().replace(/[^a-zA-Z0-9-_.~%]+/g, '_');
    try {
      const response = await messaging.subscribeToTopic(tokenList, cleanTopic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (err) {
      console.error(`❌ FCM subscribeToTopic (${cleanTopic}) error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Unsubscribe device token(s) from an FCM topic
   * @param {string|string[]} tokens - Token or array of tokens
   * @param {string} topic - Topic name
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.isConfigured() || !tokens || !topic) {
      return { success: false, error: 'FCM not ready or missing parameters' };
    }
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];
    const cleanTopic = topic.trim().replace(/[^a-zA-Z0-9-_.~%]+/g, '_');
    try {
      const response = await messaging.unsubscribeFromTopic(tokenList, cleanTopic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (err) {
      console.error(`❌ FCM unsubscribeFromTopic (${cleanTopic}) error:`, err.message);
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
   * Dispatch push notification to all users with a specific role ('buyer', 'agent', 'builder', 'tenant', 'owner')
   */
  async sendToRole(role, { title, body, data = {}, imageUrl = null, priority = 'high' }) {
    try {
      if (!role) return { successCount: 0, failureCount: 0 };
      const users = await User.find({ role: String(role).toLowerCase() }).select('fcmTokens');
      const tokens = [];
      users.forEach((u) => {
        if (u.fcmTokens && u.fcmTokens.length > 0) {
          u.fcmTokens.forEach((t) => tokens.push(t.token));
        }
      });
      return await this.sendToTokens({ tokens, title, body, data, imageUrl, priority });
    } catch (err) {
      console.error(`❌ FCM sendToRole (${role}) error:`, err.message);
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
   * Broadcast notification to all users via 'all_users' topic
   */
  async sendToAll({ title, body, data = {}, imageUrl = null, priority = 'high' }) {
    return await this.sendToTopic({ topic: 'all_users', title, body, data, imageUrl, priority });
  }

  /**
   * Remove invalid or expired tokens from database (safe when DB is connected)
   */
  async cleanInvalidTokens(invalidTokens = []) {
    if (!invalidTokens || invalidTokens.length === 0) return;
    if (mongoose.connection.readyState !== 1) return; // Skip if DB is not connected

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
