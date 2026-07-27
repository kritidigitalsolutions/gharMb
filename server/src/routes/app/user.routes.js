/**
 * App Client User Routes
 * Exposes endpoints for profile data, Agent Registration, and Developer Registration.
 */

const express = require('express');
const userController = require('../../controllers/app/user.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes require login
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.post('/register-agent', userController.registerAgent);
router.post('/register-developer', userController.registerDeveloper);

module.exports = router;
