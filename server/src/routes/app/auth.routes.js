/**
 * App Client Auth Routes
 * Exposes endpoints for Firebase ID token verification and registration.
 */

const express = require('express');
const authController = require('../../controllers/app/auth.controller');

const router = express.Router();

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);

module.exports = router;
