/**
 * App Favorite Listing Routes
 * Maps bookmarks and saved properties list handlers.
 */

const express = require('express');
const favoriteController = require('../../controllers/user/favorite.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(userAuth);
router.use(restrictTo('buyer', 'tenant'));

router.get('/', favoriteController.getMyFavorites);
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;
