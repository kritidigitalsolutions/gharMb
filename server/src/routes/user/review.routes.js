/**
 * Direct Review Routes
 * Supports root review endpoints: /api/reviews, /api/developer-reviews, and property reviews
 */

const express = require('express');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const propertyReviewController = require('../../controllers/user/property-review.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Helper dispatcher for POST /api/reviews
const createReviewDispatcher = (req, res, next) => {
  if (req.body.property || req.body.propertyId || req.query.type === 'property') {
    return propertyReviewController.createPropertyReview(req, res, next);
  }
  return developerReviewController.createDeveloperReview(req, res, next);
};

// Property Review Endpoints
router.get('/property/:id', propertyReviewController.getPropertyReviews);
router.post('/property', userAuth, propertyReviewController.createPropertyReview);
router.post('/property/:id', userAuth, propertyReviewController.createPropertyReview);
router.get('/property/:id/my-review', userAuth, propertyReviewController.getMyPropertyReview);
router.delete('/property/:id', userAuth, propertyReviewController.deletePropertyReview);

// Developer Reviews Endpoints
router.get('/developer/:id', developerReviewController.getDeveloperReviews);
router.post('/developer', userAuth, developerReviewController.createDeveloperReview);
router.get('/developer/:id/my-review', userAuth, developerReviewController.getMyDeveloperReview);

// Unified Root Endpoints
router.get('/:id', developerReviewController.getDeveloperReviews);
router.post('/', userAuth, createReviewDispatcher);
router.delete('/:id', userAuth, developerReviewController.deleteDeveloperReview);

module.exports = router;
