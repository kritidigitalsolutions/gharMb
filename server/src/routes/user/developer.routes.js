/**
 * Developer Routes
 * Exposes endpoints for developer profiles, listings, and reviews.
 */

const express = require('express');
const userController = require('../../controllers/user/user.controller');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Public routes
router.get('/', userController.getVerifiedDevelopers);
router.get('/:id', userController.getDeveloperProfile);
router.get('/:id/reviews', developerReviewController.getDeveloperReviews);

// Protected routes (Buyer / Tenant review submission)
router.post('/:id/reviews', userAuth, restrictTo('buyer', 'tenant'), developerReviewController.createDeveloperReview);

module.exports = router;
