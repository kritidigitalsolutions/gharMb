const express = require('express');
const authController = require('../../controllers/user/auth.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/send-otp', authController.sendOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.patch('/register', userAuth, authController.updateProfile);

module.exports = router;

