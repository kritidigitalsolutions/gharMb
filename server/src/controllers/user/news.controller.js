const News = require('../../models/news.model');

// @desc    Retrieve all published news articles (with optional category filter)
// @route   GET /api/news
// @access  Public
exports.getNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    const query = { isPublished: true };
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const news = await News.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await News.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: news.length,
      totalCount,
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve detailed news article (increments view count)
// @route   GET /api/news/:id
// @access  Public
exports.getSingleNews = async (req, res, next) => {
  try {
    const news = await News.findOneAndUpdate(
      { _id: req.params.id, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found or not yet published.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve featured published news articles
// @route   GET /api/news/featured
// @access  Public
exports.getFeaturedNews = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const news = await News.find({ isPublished: true, isFeatured: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      status: 'success',
      results: news.length,
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve published news articles by category
// @route   GET /api/news/category/:category
// @access  Public
exports.getCategoryNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { category } = req.params;

    const query = { isPublished: true, category };
    const skip = (Number(page) - 1) * Number(limit);

    const news = await News.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await News.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: news.length,
      totalCount,
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};