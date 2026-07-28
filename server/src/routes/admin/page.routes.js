/**
 * Admin Page Content Routes
 * Exposes admin endpoints to read and update static page contents (About Us, Help & Support).
 */

const express = require('express');
const pageController = require('../../controllers/admin/page.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth protection & admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

// GET and PUT /api/admin/pages/:type
router.route('/:type')
  .get(pageController.getPageContent)
  .put(pageController.updatePageContent);

module.exports = router;
