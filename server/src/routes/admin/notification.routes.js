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

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Retrieve history of all sent notifications
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification log history retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Broadcast a custom notification to all platform users
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 example: "App Maintenance Notice"
 *               body:
 *                 type: string
 *                 example: "The app will be offline for 10 minutes tonight."
 *               type:
 *                 type: string
 *                 default: "broadcast"
 *                 example: "broadcast"
 *     responses:
 *       201:
 *         description: Notification broadcast successfully
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 */
router.route('/')
  .get(notificationController.getNotificationLogs)
  .post(notificationController.broadcastNotification);

module.exports = router;

