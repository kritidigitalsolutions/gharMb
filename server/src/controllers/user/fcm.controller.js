/**
 * FCM Push Notification Controller
 * Manages device registration tokens and test push dispatches.
 */

const User = require('../../models/user.model');
const Admin = require('../../models/admin.model');
const fcmService = require('../../services/fcm.service');

// @desc    Register or refresh device FCM token
// @route   POST /api/user/fcm/token
// @access  Private (User or Admin)
exports.registerToken = async (req, res, next) => {
  try {
    const { token, deviceType = 'android', deviceId = null, deviceName = null } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid FCM registration token string is required.',
      });
    }

    const cleanToken = token.trim();
    const cleanDeviceType = ['android', 'ios', 'web'].includes((deviceType || '').toLowerCase())
      ? deviceType.toLowerCase()
      : 'android';

    const currentUser = req.user;
    if (!currentUser) {
      // Guest / unauthenticated device: acknowledge registration gracefully
      return res.status(200).json({
        status: 'success',
        message: 'FCM device token registered for guest device.',
        data: {
          token: cleanToken,
          deviceType: cleanDeviceType,
          deviceId,
          deviceName,
          isGuest: true,
        },
      });
    }

    // 1. Remove this token from any other accounts to ensure 1:1 active mapping
    const isCurrentUserAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'superadmin';
    await Promise.all([
      User.updateMany(
        { _id: { $ne: currentUser._id }, 'fcmTokens.token': cleanToken },
        { $pull: { fcmTokens: { token: cleanToken } } }
      ),
      Admin.updateMany(
        { _id: { $ne: currentUser._id }, 'fcmTokens.token': cleanToken },
        { $pull: { fcmTokens: { token: cleanToken } } }
      ),
    ]);

    // 2. Fetch fresh user doc from DB to ensure schema and array methods are present
    const Model = isCurrentUserAdmin ? Admin : User;
    const userDoc = await Model.findById(currentUser._id);

    if (!userDoc) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    if (!Array.isArray(userDoc.fcmTokens)) {
      userDoc.fcmTokens = [];
    }

    // 3. Upsert token entry
    const existingIndex = userDoc.fcmTokens.findIndex((t) => t.token === cleanToken);

    if (existingIndex >= 0) {
      userDoc.fcmTokens[existingIndex].deviceType = cleanDeviceType;
      userDoc.fcmTokens[existingIndex].deviceId = deviceId || userDoc.fcmTokens[existingIndex].deviceId;
      userDoc.fcmTokens[existingIndex].deviceName = deviceName || userDoc.fcmTokens[existingIndex].deviceName;
      userDoc.fcmTokens[existingIndex].lastActiveAt = new Date();
    } else {
      // Keep only up to 10 most recent devices per account
      if (userDoc.fcmTokens.length >= 10) {
        userDoc.fcmTokens.shift();
      }

      userDoc.fcmTokens.push({
        token: cleanToken,
        deviceType: cleanDeviceType,
        deviceId: deviceId || null,
        deviceName: deviceName || null,
        lastActiveAt: new Date(),
      });
    }

    await userDoc.save();

    res.status(200).json({
      status: 'success',
      message: 'FCM device token registered successfully.',
      data: {
        token: cleanToken,
        deviceType: cleanDeviceType,
        deviceId,
        activeTokensCount: userDoc.fcmTokens.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unregister device FCM token (e.g. on logout)
// @route   DELETE /api/user/fcm/token
// @access  Private (User or Admin)
exports.unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body || req.query;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
      });
    }

    const isCurrentUserAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'superadmin';
    const Model = isCurrentUserAdmin ? Admin : User;

    if (token && typeof token === 'string' && token.trim()) {
      const cleanToken = token.trim();
      await Model.findByIdAndUpdate(currentUser._id, {
        $pull: { fcmTokens: { token: cleanToken } },
      });
    } else {
      // If no specific token given, clear all tokens for this user
      await Model.findByIdAndUpdate(currentUser._id, {
        $set: { fcmTokens: [] },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'FCM device token unregistered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send test push notification to user's registered device or provided token
// @route   POST /api/user/fcm/test
// @access  Private (User or Admin)
exports.sendTestNotification = async (req, res, next) => {
  try {
    const { token, title, message, imageUrl, data } = req.body;
    const currentUser = req.user;

    let targetToken = token;

    // If no token is passed in body, lookup user's latest token
    if (!targetToken && currentUser) {
      const isCurrentUserAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'superadmin';
      const Model = isCurrentUserAdmin ? Admin : User;
      const userDoc = await Model.findById(currentUser._id).select('fcmTokens');

      if (userDoc?.fcmTokens?.length > 0) {
        // Use the most recently active token
        const sorted = [...userDoc.fcmTokens].sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
        targetToken = sorted[0].token;
      }
    }

    if (!targetToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'No FCM target token provided and no registered device found for this user.',
      });
    }

    const pushResult = await fcmService.sendToToken({
      token: targetToken,
      title: title || '🎉 GharMB Push Notification Test',
      body: message || 'Hello from GharMB! Your Flutter app is successfully configured with FCM.',
      imageUrl: imageUrl || null,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        ...(data || {}),
      },
    });

    if (!pushResult.success) {
      return res.status(502).json({
        status: 'fail',
        message: `Failed to deliver FCM push notification: ${pushResult.error}`,
        errorCode: pushResult.errorCode,
        isInvalidToken: pushResult.isInvalidToken,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Test push notification dispatched successfully!',
      data: {
        messageId: pushResult.messageId,
        targetToken: targetToken.substring(0, 20) + '...',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check FCM service and user token status
// @route   GET /api/user/fcm/status
// @access  Private (User or Admin)
exports.getStatus = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const isConfigured = fcmService.isConfigured();

    let tokensCount = 0;
    let tokens = [];

    if (currentUser) {
      const isCurrentUserAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'superadmin';
      const Model = isCurrentUserAdmin ? Admin : User;
      const doc = await Model.findById(currentUser._id).select('fcmTokens');
      tokens = (doc?.fcmTokens || []).map((t) => ({
        deviceType: t.deviceType,
        deviceId: t.deviceId,
        deviceName: t.deviceName,
        lastActiveAt: t.lastActiveAt,
        tokenPreview: t.token ? `${t.token.substring(0, 15)}...${t.token.substring(t.token.length - 6)}` : '',
      }));
      tokensCount = tokens.length;
    }

    res.status(200).json({
      status: 'success',
      data: {
        isFcmConfigured: isConfigured,
        registeredDevicesCount: tokensCount,
        devices: tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subscribe device token(s) to an FCM topic
// @route   POST /api/fcm/topic/subscribe
// @access  Public / Private
exports.subscribeTopic = async (req, res, next) => {
  try {
    const { token, tokens, topic } = req.body;
    const targetTokens = tokens || (token ? [token] : []);
    if (!topic || targetTokens.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Topic name and at least one device token are required.',
      });
    }
    const result = await fcmService.subscribeToTopic(targetTokens, topic);
    res.status(200).json({
      status: result.success ? 'success' : 'fail',
      message: result.success ? `Subscribed to topic '${topic}' successfully.` : result.error,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unsubscribe device token(s) from an FCM topic
// @route   POST /api/fcm/topic/unsubscribe
// @access  Public / Private
exports.unsubscribeTopic = async (req, res, next) => {
  try {
    const { token, tokens, topic } = req.body;
    const targetTokens = tokens || (token ? [token] : []);
    if (!topic || targetTokens.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Topic name and at least one device token are required.',
      });
    }
    const result = await fcmService.unsubscribeFromTopic(targetTokens, topic);
    res.status(200).json({
      status: result.success ? 'success' : 'fail',
      message: result.success ? `Unsubscribed from topic '${topic}' successfully.` : result.error,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Broadcast push notification to a topic or user role
// @route   POST /api/fcm/broadcast
// @access  Private (Admin)
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, topic, role, imageUrl, data } = req.body;
    if (!title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Notification title and message body are required.',
      });
    }

    let result;
    if (topic) {
      result = await fcmService.sendToTopic({
        topic,
        title,
        body: message,
        imageUrl,
        data,
      });
    } else if (role) {
      result = await fcmService.sendToRole(role, {
        title,
        body: message,
        imageUrl,
        data,
      });
    } else {
      result = await fcmService.sendToAll({
        title,
        body: message,
        imageUrl,
        data,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Broadcast notification dispatched successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
