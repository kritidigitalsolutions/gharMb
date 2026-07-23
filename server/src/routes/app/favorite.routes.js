/**
 * App Favorite Listing Routes
 * Maps bookmarks and saved properties list handlers.
 */

const express = require('express');
const favoriteController = require('../../controllers/app/favorite.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('buyer', 'tenant'));

router.get('/', favoriteController.getMyFavorites);
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;
