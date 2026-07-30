/**
 * App Enquiry Routes
 * Manages posting, fetching, and updating customer leads.
 */

const express = require('express');
const enquiryController = require('../../controllers/user/enquiry.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiries & Leads
 *   description: Endpoints for submitting questions or purchasing interest (leads) on properties/projects
 */

router.use(userAuth);

// Buyer/Tenant endpoints
/**
 * @swagger
 * /api/enquiries:
 *   post:
 *     summary: Create a new enquiry/lead on a property or project (Buyer/Tenant)
 *     tags: [Enquiries & Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f7"
 *               projectId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f8"
 *               message:
 *                 type: string
 *                 example: "I am interested in this property, please contact me."
 *     responses:
 *       201:
 *         description: Enquiry submitted successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  restrictTo('buyer', 'tenant'),
  enquiryController.createEnquiry
);

/**
 * @swagger
 * /api/enquiries/developer:
 *   post:
 *     summary: Create a new enquiry/lead directed to a builder/developer (Buyer/Tenant)
 *     tags: [Enquiries & Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - developerId
 *               - message
 *             properties:
 *               developerId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f7"
 *               message:
 *                 type: string
 *                 example: "I am interested in buying one of your developer projects."
 *     responses:
 *       201:
 *         description: Enquiry submitted successfully to developer
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/developer',
  restrictTo('buyer', 'tenant'),
  enquiryController.createDeveloperEnquiry
);

/**
 * @swagger
 * /api/enquiries/my-enquiries:
 *   get:
 *     summary: Retrieve enquiries sent by the current buyer/tenant
 *     tags: [Enquiries & Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent enquiries list
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-enquiries',
  restrictTo('buyer', 'tenant'),
  enquiryController.getMyEnquiries
);

// Seller/Agent/Builder endpoints
/**
 * @swagger
 * /api/enquiries/received:
 *   get:
 *     summary: Retrieve enquiries received by the current owner/agent/builder
 *     tags: [Enquiries & Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received enquiries list
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/received',
  restrictTo('owner', 'agent', 'builder'),
  enquiryController.getReceivedEnquiries
);

/**
 * @swagger
 * /api/enquiries/{id}:
 *   patch:
 *     summary: Update status of a received enquiry (e.g. read, contacted, closed)
 *     tags: [Enquiries & Leads]
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
 *                 enum: [pending, contacted, closed]
 *                 example: contacted
 *     responses:
 *       200:
 *         description: Enquiry status updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id',
  restrictTo('owner', 'agent', 'builder'),
  enquiryController.updateEnquiryStatus
);

module.exports = router;

