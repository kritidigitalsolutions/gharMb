/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/user/property.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Publicly accessible search and detail endpoints
router.get('/', propertyController.getAllProperties);
router.get('/near-me', propertyController.getNearMeProperties);

// Protected Dashboard route
router.get('/my-dashboard', userAuth, propertyController.getMyDashboard);

// Public detail endpoint
router.get('/:id', propertyController.getPropertyDetails);

// Protected write operations (Creation & Edits)
router.use(userAuth);

router.post('/', propertyController.createProperty);
router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;
