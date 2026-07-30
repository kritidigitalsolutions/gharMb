/**
 * App Public Legal Content Routes
 * Exposes public endpoints for reading legal documents.
 */

const express = require('express');
const legalController = require('../../controllers/user/legal.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Policies & Pages
 *   description: Public endpoints for legal documents and static page content
 */

/**
 * @swagger
 * /api/legal/{type}:
 *   get:
 *     summary: Retrieve legal content (e.g. privacy-policy, terms-conditions)
 *     tags: [Policies & Pages]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [terms-conditions, privacy-policy, refund-policy]
 *     responses:
 *       200:
 *         description: Legal content retrieved successfully
 *       404:
 *         description: Content type not found
 */
router.get('/:type', legalController.getLegalContent);

module.exports = router;

