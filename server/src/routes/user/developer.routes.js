/**
 * Developer Routes
 * Exposes endpoints for developer profiles, listings, reviews, and enquiries.
 */

const express = require('express');
const userController = require('../../controllers/user/user.controller');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const enquiryController = require('../../controllers/user/enquiry.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Public routes
router.get('/', userController.getVerifiedDevelopers);
router.get('/:id', userController.getDeveloperProfile);
router.get('/:id/reviews', developerReviewController.getDeveloperReviews);
router.get('/:id/review', developerReviewController.getDeveloperReviews);

// Protected review routes
router.post('/:id/reviews', userAuth, developerReviewController.createDeveloperReview);
router.post('/:id/review', userAuth, developerReviewController.createDeveloperReview);
router.get('/:id/my-review', userAuth, developerReviewController.getMyDeveloperReview);
router.delete('/:id/reviews', userAuth, developerReviewController.deleteDeveloperReview);
router.delete('/:id/reviews/:reviewId', userAuth, developerReviewController.deleteDeveloperReview);

// Protected developer enquiry routes (Matches "Send Enquiry" modal)
router.post('/:id/enquiries', userAuth, enquiryController.createDeveloperEnquiry);
router.post('/:id/enquiry', userAuth, enquiryController.createDeveloperEnquiry);

module.exports = router;
