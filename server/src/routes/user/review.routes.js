/**
 * Direct Review Routes
 * Supports root review endpoints: /api/reviews and /api/developer-reviews
 */

const express = require('express');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Public: get developer reviews
router.get('/developer/:id', developerReviewController.getDeveloperReviews);
router.get('/:id', developerReviewController.getDeveloperReviews);

// Protected: submit, check, or delete review
router.post('/', userAuth, developerReviewController.createDeveloperReview);
router.post('/developer', userAuth, developerReviewController.createDeveloperReview);
router.get('/developer/:id/my-review', userAuth, developerReviewController.getMyDeveloperReview);
router.delete('/:id', userAuth, developerReviewController.deleteDeveloperReview);

module.exports = router;
