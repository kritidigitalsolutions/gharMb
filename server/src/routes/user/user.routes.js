/**
 * App Client User Routes
 * Exposes endpoints for profile data, Agent Registration, and Developer Registration.
 */

const express = require('express');
const userController = require('../../controllers/user/user.controller');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: Endpoints for user profile details, updates, and Agent/Developer registration.
 */

/**
 * @swagger
 * /api/users/developers:
 *   get:
 *     summary: Retrieve verified developers/builders
 *     tags: [User Profile]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of verified developers
 */
router.get('/developers', userController.getVerifiedDevelopers);

/**
 * @swagger
 * /api/users/developers/{id}:
 *   get:
 *     summary: Retrieve detailed developer profile by ID
 *     tags: [User Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved developer profile
 *       404:
 *         description: Developer not found
 */
router.get('/developers/:id', userController.getDeveloperProfile);

/**
 * @swagger
 * /api/users/developers/{id}/reviews:
 *   get:
 *     summary: Retrieve developer reviews and ratings statistics
 *     tags: [User Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews list
 */
router.get('/developers/:id/reviews', developerReviewController.getDeveloperReviews);

// All routes require login
router.use(userAuth);

/**
 * @swagger
 * /api/users/developers/{id}/reviews:
 *   post:
 *     summary: Submit a review/rating for a developer
 *     tags: [User Profile]
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
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent construction quality."
 *               tag:
 *                 type: string
 *                 example: "Bought a premium project"
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post('/developers/:id/reviews', restrictTo('buyer', 'tenant'), developerReviewController.createDeveloperReview);


/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Retrieve current authenticated user profile details
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /api/users/update-me:
 *   patch:
 *     summary: Update current user profile basic info
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajesh Kumar
 *               email:
 *                 type: string
 *                 example: rajesh@example.com
 *               address:
 *                 type: string
 *                 example: "Sector 62, Noida"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/update-me', userController.updateMe);

/**
 * @swagger
 * /api/users/register-agent:
 *   post:
 *     summary: Register the current user as a verified Agent (requires RERA)
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reraNumber
 *               - experienceYears
 *             properties:
 *               reraNumber:
 *                 type: string
 *                 description: Real Estate Regulatory Authority registration number
 *                 example: "UPRERAPRJ123456"
 *               experienceYears:
 *                 type: number
 *                 example: 5
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["residential", "commercial"]
 *     responses:
 *       200:
 *         description: Agent registration request submitted successfully
 *       400:
 *         description: Missing fields or already registered as an agent
 *       401:
 *         description: Unauthorized
 */
router.post('/register-agent', userController.registerAgent);

/**
 * @swagger
 * /api/users/register-developer:
 *   post:
 *     summary: Register the current user as a Developer/Builder
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - registrationNumber
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: "Kriti Digital Solutions"
 *               registrationNumber:
 *                 type: string
 *                 example: "CIN-U72900DL2026PTC123456"
 *               website:
 *                 type: string
 *                 example: "https://kritidigital.com"
 *     responses:
 *       200:
 *         description: Developer registration request submitted successfully
 *       400:
 *         description: Missing fields or already registered as developer
 *       401:
 *         description: Unauthorized
 */
router.post('/register-developer', userController.registerDeveloper);

module.exports = router;

