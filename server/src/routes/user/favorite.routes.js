/**
 * App Favorite / Wishlist Listing Routes
 * Maps bookmarks, saved properties, and wishlist endpoints.
 */

const express = require('express');
const favoriteController = require('../../controllers/user/favorite.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Endpoints for saving, bookmarking, and managing user wishlist / favorite listings
 */

// All wishlist routes require authentication (works for all roles: buyer, tenant, owner, agent, builder)
router.use(userAuth);

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Retrieve list of wishlisted properties & projects for the logged-in user
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, property, project]
 *         description: Filter wishlist items by type
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', favoriteController.getMyFavorites);

/**
 * @swagger
 * /api/wishlist/ids:
 *   get:
 *     summary: Retrieve array of all wishlisted property and project IDs (for rapid feed bookmark icons)
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IDs retrieved successfully
 */
router.get('/ids', favoriteController.getFavoriteIds);

/**
 * @swagger
 * /api/wishlist/check/{id}:
 *   get:
 *     summary: Check if a property or project is currently wishlisted
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID or Project ID
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 */
router.get('/check/:id', favoriteController.checkFavorite);

/**
 * @swagger
 * /api/wishlist/toggle:
 *   post:
 *     summary: Add or remove a property / project from wishlist (toggle)
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f7"
 *               projectId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b23c4d5e6f8"
 *     responses:
 *       200:
 *         description: Item toggled off (removed from wishlist)
 *       201:
 *         description: Item toggled on (added to wishlist)
 *       401:
 *         description: Unauthorized
 */
router.post('/toggle', favoriteController.toggleFavorite);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Explicitly add a property or project to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Added to wishlist
 */
router.post('/', favoriteController.addToFavorites);

/**
 * @swagger
 * /api/wishlist/clear:
 *   delete:
 *     summary: Clear all items from the user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared
 */
router.delete('/clear', favoriteController.clearFavorites);

/**
 * @swagger
 * /api/wishlist/{id}:
 *   delete:
 *     summary: Remove an item from wishlist (by Wishlist ID, Property ID, or Project ID)
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist record ID, Property ID, or Project ID
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 */
router.delete('/:id', favoriteController.removeFavorite);

module.exports = router;
