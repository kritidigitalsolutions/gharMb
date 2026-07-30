/**
 * App Favorite Listing Routes
 * Maps bookmarks and saved properties list handlers.
 */

const express = require('express');
const favoriteController = require('../../controllers/user/favorite.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Endpoints for saving and listing favorited properties
 */

router.use(userAuth);
router.use(restrictTo('buyer', 'tenant'));

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Retrieve list of favorited properties for the logged-in user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', favoriteController.getMyFavorites);

/**
 * @swagger
 * /api/favorites/toggle:
 *   post:
 *     summary: Add or remove a property from favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f7"
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;

