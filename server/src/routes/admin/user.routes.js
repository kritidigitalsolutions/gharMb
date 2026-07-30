/**
 * Admin User Management Routes
 * Exposes account viewing, suspending, Agent RERA verification, and Developer company verification updates.
 */

const express = require('express');
const userController = require('../../controllers/admin/user.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin User Management
 *   description: Administrator endpoints for searching, reviewing, and verifying platform users
 */

// Route level protections
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Retrieve list of all users registered on the platform
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

/**
 * @swagger
 * /api/admin/users/pending-agents:
 *   get:
 *     summary: Retrieve list of agents waiting for RERA verification
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending agents list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/pending-agents', userController.getPendingAgents);

/**
 * @swagger
 * /api/admin/users/pending-developers:
 *   get:
 *     summary: Retrieve list of developers waiting for company verification
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending developers list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/pending-developers', userController.getPendingDevelopers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get detailed user profile by ID
 *     tags: [Admin User Management]
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
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update details of a user account
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User account updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Deactivate/suspend a user account
 *     tags: [Admin User Management]
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
 *         description: User account suspended successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.route('/:id')
  .get(userController.getUserDetails)
  .patch(userController.updateUser)
  .delete(userController.deactivateUser);

router.get('/:id/enquiries', userController.getUserEnquiries);

/**
 * @swagger
 * /api/admin/users/{id}/verify-agent:
 *   patch:
 *     summary: Approve/Reject RERA verification for a pending agent
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               rejectReason:
 *                 type: string
 *                 example: "Document blurred"
 *     responses:
 *       200:
 *         description: Agent verification status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/:id/verify-agent', userController.verifyAgent);

/**
 * @swagger
 * /api/admin/users/{id}/verify-developer:
 *   patch:
 *     summary: Approve/Reject company verification for a pending developer
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               rejectReason:
 *                 type: string
 *                 example: "Registration number mismatch"
 *     responses:
 *       200:
 *         description: Developer verification status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/:id/verify-developer', userController.verifyDeveloper);

module.exports = router;

