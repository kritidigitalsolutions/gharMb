/**
 * Admin Page Content Routes
 * Exposes admin endpoints to read and update static page contents (About Us, Help & Support).
 */

const express = require('express');
const pageController = require('../../controllers/admin/page.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth protection & admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/pages/{type}:
 *   get:
 *     summary: Retrieve static page content (About Us, Help, etc.)
 *     tags: [Admin Policy & Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [about-us, contact-us, help-support]
 *     responses:
 *       200:
 *         description: Page content retrieved successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Create or update static page content
 *     tags: [Admin Policy & Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [about-us, contact-us, help-support]
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
 *                 example: "About Us Page Title"
 *               content:
 *                 type: string
 *                 example: "Detailed text for about us section..."
 *     responses:
 *       200:
 *         description: Page updated successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/:type')
  .get(pageController.getPageContent)
  .put(pageController.updatePageContent);

module.exports = router;

