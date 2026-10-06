/**
 * FCM Push Notification Routes
 * Handles device token registration, unregistration, status check, and test push sending.
 */

const express = require('express');
const fcmController = require('../../controllers/user/fcm.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

// Require login to register, unregister, check status, or trigger test push
router.use(protect);

router.post('/token', fcmController.registerToken);
router.delete('/token', fcmController.unregisterToken);
router.post('/test', fcmController.sendTestNotification);
router.get('/status', fcmController.getStatus);

module.exports = router;
