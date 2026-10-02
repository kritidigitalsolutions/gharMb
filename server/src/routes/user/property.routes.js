/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/user/property.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();


const tokenRequestController = require('../../controllers/user/token-request.controller');

router.get('/', propertyController.getAllProperties);

router.get('/latest', propertyController.getLatestProperties);

router.get('/verified', propertyController.getVerifiedProperties);

router.get('/near-me', propertyController.getNearMeProperties);

router.get('/my-dashboard', userAuth, propertyController.getMyDashboard);

router.get('/my-properties', userAuth, propertyController.getMyProperties);

router.get('/token-requests', userAuth, tokenRequestController.getReceivedTokenRequests);

router.get('/:id', propertyController.getPropertyDetails);

// Property token request submission
router.post('/:id/token-request', userAuth, tokenRequestController.createTokenRequest);

// Protected write operations (Creation & Edits)
router.use(userAuth);

router.post('/', propertyController.createProperty);

// Quick toggle / update for Key Handover
router.patch('/:id/key-handover', propertyController.toggleKeyHandover);

router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;

