/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/app/property.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Publicly accessible search and detail endpoints
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyDetails);

// Protected write operations
router.use(protect);
router.use(restrictTo('owner', 'agent', 'builder'));

router.post('/', propertyController.createProperty);
router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;
