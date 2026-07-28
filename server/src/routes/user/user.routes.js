/**
 * App Client User Routes
 * Exposes endpoints for profile data, Agent Registration, and Developer Registration.
 */

const express = require('express');
const userController = require('../../controllers/user/user.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Public routes
router.get('/developers', userController.getVerifiedDevelopers);

// All routes require login
router.use(userAuth);

router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.post('/register-agent', userController.registerAgent);
router.post('/register-developer', userController.registerDeveloper);

module.exports = router;
