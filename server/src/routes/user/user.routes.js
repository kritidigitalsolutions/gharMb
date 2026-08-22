/**
 * App Client User Routes
 * Exposes endpoints for profile data, Agent Registration, and Developer Registration.
 */

const express = require('express');
const userController = require('../../controllers/user/user.controller');
const developerReviewController = require('../../controllers/user/developer-review.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.get('/developers', userController.getVerifiedDevelopers);

router.get('/developers/:id', userController.getDeveloperProfile);

router.get('/developers/:id/reviews', developerReviewController.getDeveloperReviews);

// All routes require login
router.use(userAuth);

router.post('/developers/:id/reviews', restrictTo('buyer', 'tenant'), developerReviewController.createDeveloperReview);


router.get('/me', userController.getMe);

router.patch('/update-me', upload.any(), userController.updateMe);

router.post('/register-agent', upload.any(), userController.registerAgent);

router.post('/register-developer', upload.any(), userController.registerDeveloper);

module.exports = router;

