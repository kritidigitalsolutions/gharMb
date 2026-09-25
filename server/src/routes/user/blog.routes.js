const express = require('express');
const blogController = require('../../controllers/user/blog.controller');

const router = express.Router();

// Get active categories for tabs / filters
router.get('/categories', blogController.getActiveCategories);

// Get published blogs listing
router.get('/', blogController.getPublishedBlogs);

// Get single blog by slug (with view increment & related blogs)
router.get('/:slug', blogController.getBlogBySlug);

module.exports = router;
