/**
 * Admin Auth Routes
 * Mounts endpoints for authentication, login, and self-checks.
 */

const express = require('express');
const authController = require('../../controllers/admin/auth.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Authentication
 *   description: Endpoints for administrator credentials, authorization, and profile checks
 */

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Log in as an administrator
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@gharmb.com"
 *               password:
 *                 type: string
 *                 example: "AdminPassword123!"
 *     responses:
 *       200:
 *         description: Login successful. Returns Bearer token.
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.loginAdmin);

/**
 * @swagger
 * /api/admin/auth/register:
 *   post:
 *     summary: Register a new administrator account (typically restricted/dev use)
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Super Admin"
 *               email:
 *                 type: string
 *                 example: "admin2@gharmb.com"
 *               password:
 *                 type: string
 *                 example: "AdminPassword123!"
 *     responses:
 *       201:
 *         description: Administrator registered successfully
 *       400:
 *         description: Email already in use
 */
router.post('/register', authController.registerAdmin); // Typically restricted or disabled in production

// Protected routes (Only Admins allowed)
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/auth/me:
 *   get:
 *     summary: Retrieve currently logged-in administrator profile details
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authController.getMe);

module.exports = router;

