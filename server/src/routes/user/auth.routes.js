/**
 * App Client Auth Routes
 * Exposes endpoints for Mobile Registration, OTP Verification, Resend OTP, and Progressive Profile Updates.
 */

const express = require('express');
const authController = require('../../controllers/user/auth.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: Endpoints for mobile OTP sign-up, sign-in, and progressive onboarding
 */

/**
 * @swagger
 * /api/user/auth/register:
 *   post:
 *     summary: Register a new user (Step 1 - Send OTP)
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: Rajesh Kumar
 *               email:
 *                 type: string
 *                 description: Optional email address
 *                 example: rajesh@example.com
 *               phone:
 *                 type: string
 *                 description: Mobile phone number (auto-normalized to include +91 country code if 10 digits)
 *                 example: "9876543210"
 *               address:
 *                 type: string
 *                 description: Formatted string address or structured object
 *                 example: "Sector 62, Noida, UP"
 *               latitude:
 *                 type: number
 *                 description: Geographic latitude for geolocation mapping
 *                 example: 28.6273
 *               longitude:
 *                 type: number
 *                 description: Geographic longitude for geolocation mapping
 *                 example: 77.3725
 *     responses:
 *       200:
 *         description: OTP sent successfully to the mobile number (Check backend console for OTP log)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully to +919876543210. Check backend terminal for OTP log.
 *                 phone:
 *                   type: string
 *                   example: "+919876543210"
 *                 otp:
 *                   type: string
 *                   example: "583921"
 *       400:
 *         description: Missing fields or user already registered
 */
router.post('/register', authController.registerUser);

/**
 * @swagger
 * /api/user/auth/send-otp:
 *   post:
 *     summary: Send OTP for existing user sign-in
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Registered mobile number
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Missing phone number
 *       404:
 *         description: User not found with this mobile number
 */
router.post('/send-otp', authController.sendOtp);

/**
 * @swagger
 * /api/user/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to a mobile number
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Missing phone number
 */
router.post('/resend-otp', authController.resendOtp);

/**
 * @swagger
 * /api/user/auth/verify-otp:
 *   post:
 *     summary: Verify OTP & Create Session/Account (Step 2 - Complete Sign In/Registration)
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 description: The 6-digit OTP code (can use default "123456" in dev/test environment)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authentication successful. Returns JWT Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsIn..."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         role:
 *                           type: string
 *                         isOnboardingCompleted:
 *                           type: boolean
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User profile not found
 */
router.post('/verify-otp', authController.verifyOtp);

/**
 * @swagger
 * /api/user/auth/register:
 *   patch:
 *     summary: Progressive Profile Setup (Step 3 - Set Role, Intents, Preferences)
 *     tags: [User Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [buyer, seller, agent, builder]
 *                 example: buyer
 *               intents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["buy_property", "invest"]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   propertyTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["apartment", "villa"]
 *                   budgetMin:
 *                     type: number
 *                     example: 5000000
 *                   budgetMax:
 *                     type: number
 *                     example: 15000000
 *                   locations:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Noida", "Gurugram"]
 *               notificationSettings:
 *                 type: object
 *                 properties:
 *                   push:
 *                     type: boolean
 *                     default: true
 *                   email:
 *                     type: boolean
 *                     default: true
 *                   sms:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: Onboarding profile updated successfully.
 *       401:
 *         description: Unauthorized. Missing or invalid Bearer JWT token.
 */
router.patch('/register', userAuth, authController.updateProfile);

module.exports = router;

