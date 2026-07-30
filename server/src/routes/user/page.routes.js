/**
 * App Public Page Routes
 * Exposes public endpoints for reading general page contents (About Us, Help & Support).
 */

const express = require('express');
const pageController = require('../../controllers/user/page.controller');

const router = express.Router();

/**
 * @swagger
 * /api/pages/{type}:
 *   get:
 *     summary: Retrieve general page content (e.g. about-us, contact-us, help-support)
 *     tags: [Policies & Pages]
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
 *       404:
 *         description: Page type not found
 */
router.get('/:type', pageController.getPageContent);

module.exports = router;

