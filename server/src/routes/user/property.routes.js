/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/user/property.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();


const tokenRequestController = require('../../controllers/user/token-request.controller');
const visitRequestController = require('../../controllers/user/visit-request.controller');

const propertyReviewController = require('../../controllers/user/property-review.controller');

const optionalAuth = userAuth.optionalUserAuth || userAuth;

router.get('/', optionalAuth, propertyController.getAllProperties);

router.get('/latest', optionalAuth, propertyController.getLatestProperties);

router.get('/verified', optionalAuth, propertyController.getVerifiedProperties);

router.get('/near-me', optionalAuth, propertyController.getNearMeProperties);

// 🛡️ NEW PROJECTS PAGE: Exclusively returns verified Developer/Builder properties
router.get('/new-projects', optionalAuth, propertyController.getNewProjectsProperties);

router.get('/my-dashboard', userAuth, propertyController.getMyDashboard);

router.get('/my-properties', userAuth, propertyController.getMyProperties);

router.get('/my-ratings', userAuth, propertyReviewController.getMyOwnerReviews);
router.get('/owner-ratings', userAuth, propertyReviewController.getMyOwnerReviews);

router.get('/token-requests', userAuth, tokenRequestController.getReceivedTokenRequests);
router.get('/visit-requests', userAuth, visitRequestController.getReceivedVisitRequests);

// Property ratings and reviews
router.get('/:id/reviews', optionalAuth, propertyReviewController.getPropertyReviews);
router.get('/:id/ratings', optionalAuth, propertyReviewController.getPropertyReviews);
router.get('/:id/my-review', userAuth, propertyReviewController.getMyPropertyReview);
router.post('/:id/reviews', userAuth, propertyReviewController.createPropertyReview);
router.post('/:id/rate', userAuth, propertyReviewController.createPropertyReview);
router.delete('/:id/reviews/:reviewId', userAuth, propertyReviewController.deletePropertyReview);
router.delete('/reviews/:reviewId', userAuth, propertyReviewController.deletePropertyReview);

router.get('/:id', optionalAuth, propertyController.getPropertyDetails);

// Property token booking configuration (Amounts configured by Admin)
router.get('/:id/token-config', optionalAuth, tokenRequestController.getTokenConfig);
router.get('/:id/token-request/config', optionalAuth, tokenRequestController.getTokenConfig);

// Property token request submission (1-Click or Form, authenticated or guest)
router.post('/:id/token-request', optionalAuth, tokenRequestController.createTokenRequest);

// Property site visit scheduling
router.post('/:id/visit-request', userAuth, visitRequestController.createVisitRequest);
router.post('/:id/schedule-visit', userAuth, visitRequestController.createVisitRequest);

// Protected write operations (Creation & Edits)
router.use(userAuth);

router.post('/', propertyController.createProperty);

// Quick toggle / update for Key Handover
router.patch('/:id/key-handover', propertyController.toggleKeyHandover);

router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;

