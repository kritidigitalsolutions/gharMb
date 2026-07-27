/**
 * App Client Auth Routes
 * Exposes endpoints for Mobile Registration, OTP Verification, Resend OTP, and Progressive Profile Updates.
 */

const express = require('express');
const authController = require('../../controllers/app/auth.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

// Public Mobile Auth Routes
router.post('/register', authController.registerUser);
router.post('/send-otp', authController.sendOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Protected Progressive Profile Setup (PATCH /api/user/auth/register)
router.patch('/register', protect, authController.updateProfile);

module.exports = router;
