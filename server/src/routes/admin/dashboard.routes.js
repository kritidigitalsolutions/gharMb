/**
 * Admin Dashboard Routes
 * Exposes KPI queries to users holding 'admin' privileges.
 */

const express = require('express');
const dashboardController = require('../../controllers/admin/dashboard.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Endpoints for dashboard analytics and KPI data metrics
 */

// Apply auth boundaries
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Retrieve analytics, user counts, properties counts, and status metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', dashboardController.getDashboardStats);

router.get('/enquiries', dashboardController.getAllEnquiries);
router.patch('/enquiries/:id', dashboardController.updateEnquiry);
router.delete('/enquiries/:id', dashboardController.deleteEnquiry);
router.get('/revenue', dashboardController.getRevenueStats);

module.exports = router;

