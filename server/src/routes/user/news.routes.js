const express = require('express');
const {
  getNews,
  getSingleNews,
  getFeaturedNews,
  getCategoryNews,
} = require('../../controllers/user/news.controller');

const router = express.Router();

// Retrieve all news (paginated, with optional category query parameter)
router.get('/', getNews);

// Retrieve featured news
router.get('/featured', getFeaturedNews);

// Retrieve news by category (from route parameter)
router.get('/category/:category', getCategoryNews);

// Retrieve single news article by ID
router.get('/:id', getSingleNews);

module.exports = router;