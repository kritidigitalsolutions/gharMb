/**
 * Admin Property Management Routes
 * Exposes listing approvals, deletion, and spotlight adjustments.
 */

const express = require('express');
const propertyController = require('../../controllers/admin/property.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Property Management
 *   description: Administrator endpoints for listing, status approvals, delete, and featuring properties
 */

// Route level protections
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/properties:
 *   get:
 *     summary: Retrieve list of all property listings (including pending/suspended)
 *     tags: [Admin Property Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/')
  .get(propertyController.getAllProperties);

/**
 * @swagger
 * /api/admin/properties/{id}:
 *   delete:
 *     summary: Permanently delete a property listing
 *     tags: [Admin Property Management]
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
 *         description: Property deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.route('/:id')
  .delete(propertyController.deleteProperty);

/**
 * @swagger
 * /api/admin/properties/{id}/status:
 *   patch:
 *     summary: Approve or suspend a property listing
 *     tags: [Admin Property Management]
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
 *                 enum: [pending, approved, suspended]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Property status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.patch('/:id/status', propertyController.updatePropertyStatus);

/**
 * @swagger
 * /api/admin/properties/{id}/featured:
 *   patch:
 *     summary: Toggle spotlight/featured status on a property listing
 *     tags: [Admin Property Management]
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
 *         description: Property featured status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.patch('/:id/featured', propertyController.toggleFeatured);

module.exports = router;

