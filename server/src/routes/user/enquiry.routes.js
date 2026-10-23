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

const optionalAuth = userAuth.optionalUserAuth || userAuth;

// Public & Authenticated Enquiry Creation:
// Allows both registered users and website visitors/leads to submit enquiries (sends directly to Admin Panel)
router.post(
  '/',
  optionalAuth,
  enquiryController.createEnquiry
);

const serviceEnquiryController = require('../../controllers/user/service-enquiry.controller');

router.post(
  '/developer',
  optionalAuth,
  enquiryController.createDeveloperEnquiry
);

// Home Loan Lead & Quick Eligibility Enquiry (routes directly to Admin Panel)
router.post(
  ['/home-loan', '/loan', '/home-loans', '/loans', '/home-loan/enquiry', '/loan/enquiry'],
  optionalAuth,
  serviceEnquiryController.createHomeLoanEnquiry
);

// All personal enquiry list & management routes require authenticated user
router.use(userAuth);

/**
 * @swagger
 * /api/users/enquiries/my-enquiries:
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
 * /api/users/enquiries/received:
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
 * /api/users/enquiries/{id}:
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

