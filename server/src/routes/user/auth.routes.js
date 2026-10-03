/**
 * User Authentication Routes
 * ─────────────────────────────────────────────────────────────────────────────
 *  UNIFIED OTP FLOW (New & Existing Users)
 *    POST   /api/user/auth/send-otp       → Step 1: Send OTP to any phone
 *                                            returns isNewUser: true/false
 *    POST   /api/user/auth/resend-otp     → Resend OTP (new or existing user)
 *    POST   /api/user/auth/verify-otp     → Step 2: Verify OTP
 *                                            Existing → JWT token (login)
 *                                            New      → verifiedPhone + nextScreen:'register'
 *
 *  REGISTRATION (New User — after OTP phone verification)
 *    POST   /api/user/auth/register       → Create account (phone pre-verified)
 *
 *  PROFILE
 *    PATCH  /api/user/auth/update-profile → Update profile fields (role, intents, preferences…)
 *    PATCH  /api/user/auth/register       → Alias for update-profile (backward compat)
 *    GET    /api/user/auth/me             → Get current user profile
 *
 *  GOOGLE / FIREBASE
 *    POST   /api/user/auth/google         → Google / Firebase Sign-In
 *
 *  LEGACY
 *    POST   /api/user/auth/basic-info     → Submit basic info (for Google-auth users)
 *    PATCH  /api/user/auth/basic-info     → Update basic info
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const authController = require('../../controllers/user/auth.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// ── Registration (new user — no OTP) ─────────────────────────────────────────
router.post('/register', authController.registerUser);

// ── Login OTP flow (existing users only) ─────────────────────────────────────
router.post('/send-otp', authController.sendOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/verify-otp', authController.verifyOtp);

// ── Profile update (authenticated) ───────────────────────────────────────────
router.patch('/register', userAuth, authController.updateProfile);
router.patch('/update-profile', userAuth, authController.updateProfile);

// ── Basic info (legacy — for Google-auth users completing profile) ────────────
router.post('/basic-info', authController.submitBasicInfo);
router.patch('/basic-info', authController.submitBasicInfo);

// ── Google / Firebase Auth ────────────────────────────────────────────────────
router.post('/google', authController.googleAuth);

// ── Refresh Auth Token ────────────────────────────────────────────────────────
router.post('/refresh-token', authController.refreshToken);
router.post('/refresh', authController.refreshToken);

// ── Current user profile & verification ─────────────────────────────────────────
router.get('/me', userAuth, authController.getMe);
router.get('/verification-status', userAuth, authController.getVerificationStatus);

module.exports = router;
