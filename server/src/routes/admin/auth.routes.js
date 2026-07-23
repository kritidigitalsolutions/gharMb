/**
 * Admin Auth Routes
 * Mounts endpoints for authentication, login, and self-checks.
 */

const express = require('express');
const authController = require('../../controllers/admin/auth.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Public routes
router.post('/login', authController.loginAdmin);
router.post('/register', authController.registerAdmin); // Typically restricted or disabled in production

// Protected routes (Only Admins allowed)
router.use(protect);
router.use(restrictTo('admin'));

router.get('/me', authController.getMe);

module.exports = router;
