/**
 * Admin Legal Content Routes
 * Exposes admin endpoints to read and update legal documents.
 */

const express = require('express');
const legalController = require('../../controllers/admin/legal.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Policy & Content
 *   description: Administrator endpoints for updating legal documents and static pages
 */

// Apply auth protection & admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/legal/{type}:
 *   get:
 *     summary: Retrieve legal content policy document
 *     tags: [Admin Policy & Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [terms-conditions, privacy-policy, refund-policy]
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Create or update legal content policy document
 *     tags: [Admin Policy & Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [terms-conditions, privacy-policy, refund-policy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Privacy Policy Update"
 *               content:
 *                 type: string
 *                 example: "Detailed privacy policy text contents..."
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/:type')
  .get(legalController.getLegalContent)
  .put(legalController.updateLegalContent);

module.exports = router;

