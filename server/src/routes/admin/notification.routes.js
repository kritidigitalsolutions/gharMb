/**
 * Admin Notification Routes
 * Exposes targeted and broadcast notification triggers.
 */

const express = require('express');
const notificationController = require('../../controllers/admin/notification.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Notifications
 *   description: Administrator endpoints for listing logs and broadcasting notifications
 */

// Apply security boundaries
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(notificationController.getNotificationLogs)
  .post(notificationController.broadcastNotification);

router.post('/mark-all-read', notificationController.markAllNotificationsRead);
router.patch('/:id/read', notificationController.markNotificationRead);

module.exports = router;

