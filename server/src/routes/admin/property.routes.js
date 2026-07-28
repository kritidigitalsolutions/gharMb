/**
 * Admin Property Management Routes
 * Exposes listing approvals, deletion, and spotlight adjustments.
 */

const express = require('express');
const propertyController = require('../../controllers/admin/property.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Route level protections
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(propertyController.getAllProperties);

router.route('/:id')
  .delete(propertyController.deleteProperty);

router.patch('/:id/status', propertyController.updatePropertyStatus);
router.patch('/:id/featured', propertyController.toggleFeatured);

module.exports = router;
