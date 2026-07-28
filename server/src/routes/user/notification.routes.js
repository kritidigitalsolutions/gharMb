/**
 * App Notification Routes
 * Exposes paths to view and read notifications.
 */

const express = require('express');
const notificationController = require('../../controllers/user/notification.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

router.use(userAuth);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
