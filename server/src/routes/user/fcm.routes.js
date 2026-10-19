/**
 * FCM Push Notification Routes
 * Handles device token registration, unregistration, topic subscriptions, status check, and test push sending.
 */

const express = require('express');
const fcmController = require('../../controllers/user/fcm.controller');
const protect = require('../../middlewares/auth.middleware');
const { optionalUserAuth } = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Device token registration & status (supports both authenticated users and guest devices)
router.post('/token', optionalUserAuth, fcmController.registerToken);
router.delete('/token', optionalUserAuth, fcmController.unregisterToken);
router.get('/status', optionalUserAuth, fcmController.getStatus);

// Topic management (e.g. 'announcements', 'all_users')
router.post('/topic/subscribe', optionalUserAuth, fcmController.subscribeTopic);
router.post('/topic/unsubscribe', optionalUserAuth, fcmController.unsubscribeTopic);

// Authenticated test and broadcast endpoints
router.post('/test', protect, fcmController.sendTestNotification);
router.post('/broadcast', protect, fcmController.broadcastNotification);

module.exports = router;
