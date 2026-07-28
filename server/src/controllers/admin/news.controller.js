const News = require('../../models/news.model');

// @desc    Create a news article
// @route   POST /api/admin/news
// @access  Private (Admin only)
exports.createNews = async (req, res, next) => {
  try {
    const { title, shortDescription, description, image, category, readTime, isFeatured } = req.body;

    const news = await News.create({
      title,
      shortDescription,
      description,
      image: image || '',
      category,
      readTime: readTime || 3,
      isFeatured: isFeatured || false,
    });

    res.status(201).json({
      status: 'success',
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all news articles (both published and draft)
// @route   GET /api/admin/news
// @access  Private (Admin only)
exports.getAllNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    const query = {};
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const news = await News.find(query)
      .sort({ createdAt: -1 })
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

// @desc    Get a news article by ID
// @route   GET /api/admin/news/:id
// @access  Private (Admin only)
exports.getNewsById = async (req, res, next) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found.',
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

// @desc    Update a news article
// @route   PUT /api/admin/news/:id
// @access  Private (Admin only)
exports.updateNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found.',
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

// @desc    Delete a news article
// @route   DELETE /api/admin/news/:id
// @access  Private (Admin only)
exports.deleteNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'News article deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a news article
// @route   PATCH /api/admin/news/:id/publish
// @access  Private (Admin only)
exports.publishNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, publishedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'News article published successfully.',
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish a news article
// @route   PATCH /api/admin/news/:id/unpublish
// @access  Private (Admin only)
exports.unpublishNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { isPublished: false, publishedAt: null },
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        status: 'fail',
        message: 'News article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'News article unpublished successfully.',
      data: {
        news,
      },
    });
  } catch (error) {
    next(error);
  }
};