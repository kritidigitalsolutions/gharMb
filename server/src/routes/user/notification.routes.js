/**
 * App Notification Routes
 * Exposes paths to view and read notifications.
 */

const express = require('express');
const notificationController = require('../../controllers/user/notification.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Endpoints for user activity/in-app notifications
 */

router.use(protect);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve list of notifications for the current authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', notificationController.getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.route('/:id/read')
  .patch(notificationController.markAsRead)
  .put(notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications of the current user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/notifications/clear-all:
 *   delete:
 *     summary: Delete all notifications of the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/clear-all', notificationController.deleteAllNotifications);
router.delete('/', notificationController.deleteAllNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a specific notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found or access denied
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

