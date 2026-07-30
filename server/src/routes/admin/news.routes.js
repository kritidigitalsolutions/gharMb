const express = require("express");
const {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  publishNews,
  unpublishNews,
} = require("../../controllers/admin/news.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin News & Articles
 *   description: Administrator endpoints for managing news articles and blog posts
 */

/**
 * @swagger
 * /api/admin/news:
 *   post:
 *     summary: Create a new news article draft
 *     tags: [Admin News & Articles]
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Market Updates Q3 2026"
 *               content:
 *                 type: string
 *                 example: "Detailed report on real estate growth..."
 *               category:
 *                 type: string
 *                 example: "Market"
 *               isFeatured:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: News article created successfully
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Retrieve all news articles (both drafts and published)
 *     tags: [Admin News & Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all news
 *       401:
 *         description: Unauthorized
 */
router.post("/", createNews);
router.get("/", getAllNews);

/**
 * @swagger
 * /api/admin/news/{id}:
 *   get:
 *     summary: Retrieve details of any news article by ID
 *     tags: [Admin News & Articles]
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
 *         description: Article retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 *   put:
 *     summary: Update an existing news article
 *     tags: [Admin News & Articles]
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 *   delete:
 *     summary: Delete a news article
 *     tags: [Admin News & Articles]
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
 *         description: Article deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 */
router.get("/:id", getNewsById);
router.put("/:id", updateNews);
router.delete("/:id", deleteNews);

/**
 * @swagger
 * /api/admin/news/{id}/publish:
 *   patch:
 *     summary: Publish a news article draft (makes it publicly visible)
 *     tags: [Admin News & Articles]
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
 *         description: Article published successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 */
router.patch("/:id/publish", publishNews);

/**
 * @swagger
 * /api/admin/news/{id}/unpublish:
 *   patch:
 *     summary: Unpublish a news article (takes it down from public view)
 *     tags: [Admin News & Articles]
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
 *         description: Article unpublished successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 */
router.patch("/:id/unpublish", unpublishNews);

module.exports = router;