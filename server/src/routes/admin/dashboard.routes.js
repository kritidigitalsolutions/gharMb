/**
 * Admin Dashboard Routes
 * Exposes KPI queries to users holding 'admin' privileges.
 */

const express = require('express');
const dashboardController = require('../../controllers/admin/dashboard.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth boundaries
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
