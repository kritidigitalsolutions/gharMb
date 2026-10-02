/**
 * User Banner Routes
 * Endpoints for mobile apps and web frontend to fetch active banners & track clicks.
 */

const express = require('express');
const bannerController = require('../../controllers/user/banner.controller');

const router = express.Router();

// GET /api/banners/home - Structured banners specifically for Home Screen (hero, middle, commercial)
router.get('/home', bannerController.getHomeBanners);

// GET /api/banners - All active banners (optional ?position=home_top or ?position=commercial)
router.get('/', bannerController.getActiveBanners);

// Track clicks (supports both PATCH and POST)
router.patch('/:id/click', bannerController.trackBannerClick);
router.post('/:id/click', bannerController.trackBannerClick);

// GET /api/banners/:id - Single banner details
router.get('/:id', bannerController.getBannerById);

module.exports = router;
