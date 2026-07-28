/**
 * App Public Page Routes
 * Exposes public endpoints for reading general page contents (About Us, Help & Support).
 */

const express = require('express');
const pageController = require('../../controllers/user/page.controller');

const router = express.Router();

// GET /api/pages/:type - Retrieve static page content
router.get('/:type', pageController.getPageContent);

module.exports = router;
