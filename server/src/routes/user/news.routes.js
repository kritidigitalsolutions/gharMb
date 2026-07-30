const express = require('express');
const {
  getNews,
  getSingleNews,
  getFeaturedNews,
  getCategoryNews,
} = require('../../controllers/user/news.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: News & Articles
 *   description: Public endpoints for reading published news and articles
 */

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Retrieve all published news articles
 *     tags: [News & Articles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category to filter articles (e.g. Market, Finance, Legal)
 *     responses:
 *       200:
 *         description: Success response containing the array of articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 1
 *                 totalCount:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           category:
 *                             type: string
 *                           isPublished:
 *                             type: boolean
 *                           isFeatured:
 *                             type: boolean
 *                           views:
 *                             type: integer
 */
router.get('/', getNews);

/**
 * @swagger
 * /api/news/featured:
 *   get:
 *     summary: Retrieve featured published news articles
 *     tags: [News & Articles]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of featured articles to return
 *     responses:
 *       200:
 *         description: Success response containing the array of featured articles
 */
router.get('/featured', getFeaturedNews);

/**
 * @swagger
 * /api/news/category/{category}:
 *   get:
 *     summary: Retrieve published news articles by category
 *     tags: [News & Articles]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The category name (e.g. Market, Buying, Selling, Legal)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success response containing category-filtered articles
 */
router.get('/category/:category', getCategoryNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Retrieve a detailed news article by ID (increments view count)
 *     tags: [News & Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The news article ID
 *     responses:
 *       200:
 *         description: Detailed news article retrieved successfully
 *       404:
 *         description: News article not found or not published
 */
router.get('/:id', getSingleNews);

module.exports = router;