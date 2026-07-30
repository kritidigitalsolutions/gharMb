/**
 * App Property Listing Routes
 * Links routes for property list feeds, detail retrieval, listing creation, and ownership edits.
 */

const express = require('express');
const propertyController = require('../../controllers/user/property.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Endpoints for browsing, searching, and managing property listings
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Retrieve list of all property listings (with filters)
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword (matches title/description/city)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, villa, house, plot, commercial]
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *           enum: [sell, rent]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 */
router.get('/', propertyController.getAllProperties);

/**
 * @swagger
 * /api/properties/near-me:
 *   get:
 *     summary: Retrieve properties sorted by distance to coordinates
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 10000
 *         description: Maximum distance in meters
 *     responses:
 *       200:
 *         description: Near-me properties retrieved successfully
 */
router.get('/near-me', propertyController.getNearMeProperties);

/**
 * @swagger
 * /api/properties/my-dashboard:
 *   get:
 *     summary: Retrieve current user's uploaded properties dashboard
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's dashboard property statistics and lists
 *       401:
 *         description: Unauthorized
 */
router.get('/my-dashboard', userAuth, propertyController.getMyDashboard);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Retrieve detailed property info by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details retrieved successfully
 *       404:
 *         description: Property not found
 */
router.get('/:id', propertyController.getPropertyDetails);

// Protected write operations (Creation & Edits)
router.use(userAuth);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - type
 *               - purpose
 *               - address
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Luxurious 3 BHK Apartment"
 *               description:
 *                 type: string
 *                 example: "Spacious semi-furnished apartment in premium society"
 *               price:
 *                 type: number
 *                 example: 8500000
 *               type:
 *                 type: string
 *                 enum: [apartment, villa, house, plot, commercial]
 *                 example: apartment
 *               purpose:
 *                 type: string
 *                 enum: [sell, rent]
 *                 example: sell
 *               address:
 *                 type: object
 *                 properties:
 *                   formattedAddress:
 *                     type: string
 *                     example: "Sector 150, Noida, UP"
 *                   city:
 *                     type: string
 *                     example: "Noida"
 *               latitude:
 *                 type: number
 *                 example: 28.5355
 *               longitude:
 *                 type: number
 *                 example: 77.3910
 *     responses:
 *       201:
 *         description: Property listing created successfully
 *       400:
 *         description: Missing fields or invalid body
 *       401:
 *         description: Unauthorized
 */
router.post('/', propertyController.createProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update an existing property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Property listing updated successfully
 *       401:
 *         description: Unauthorized/Not owner
 *       404:
 *         description: Property not found
 *   delete:
 *     summary: Delete a property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       401:
 *         description: Unauthorized/Not owner
 *       404:
 *         description: Property not found
 */
router.route('/:id')
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;

