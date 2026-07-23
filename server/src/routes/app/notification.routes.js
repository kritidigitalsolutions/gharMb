/**
 * App Notification Routes
 * Exposes paths to view and read notifications.
 */

const express = require('express');
const notificationController = require('../../controllers/app/notification.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
