/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/user/property.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();


router.get('/', propertyController.getAllProperties);

router.get('/near-me', propertyController.getNearMeProperties);

router.get('/my-dashboard', userAuth, propertyController.getMyDashboard);

router.get('/:id', propertyController.getPropertyDetails);

// Protected write operations (Creation & Edits)
router.use(userAuth);

router.post('/', propertyController.createProperty);

router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;

