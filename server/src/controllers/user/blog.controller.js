const Blog = require('../../models/blog.model');
const BlogCategory = require('../../models/blog-category.model');

// @desc    Get all published blog articles (public)
// @route   GET /api/blogs
// @access  Public
exports.getPublishedBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;

    const query = { isPublished: true };

    if (category) {
      // Find category by slug
      const categoryDoc = await BlogCategory.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // Try by ID
        query.category = category;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, totalCount] = await Promise.all([
      Blog.find(query)
        .populate('category', 'name slug')
        .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-content -seo')
        .lean(),
      Blog.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      results: blogs.length,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
      data: { blogs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active blog categories (public)
// @route   GET /api/blogs/categories
// @access  Public
exports.getActiveCategories = async (req, res, next) => {
  try {
    const categories = await BlogCategory.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('name slug')
      .lean();

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single published blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found or not yet published.',
      });
    }

    // Get related blogs (same category first, exclude current, max 8)
    const blogCatId = blog.category?._id || blog.category;
    let relatedBlogs = await Blog.find({
      category: blogCatId,
      _id: { $ne: blog._id },
      isPublished: true,
    })
      .populate('category', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(8)
      .select('-content -seo')
      .lean();

    // If fewer than 8, fill with latest published articles from other categories
    if (relatedBlogs.length < 8) {
      const needed = 8 - relatedBlogs.length;
      const excludeIds = [blog._id, ...relatedBlogs.map(b => b._id)];
      const fallbackBlogs = await Blog.find({
        _id: { $nin: excludeIds },
        isPublished: true,
      })
        .populate('category', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(needed)
        .select('-content -seo')
        .lean();

      relatedBlogs = [...relatedBlogs, ...fallbackBlogs];
    }

    res.status(200).json({
      status: 'success',
      data: {
        blog,
        relatedBlogs,
      },
    });
  } catch (error) {
    next(error);
  }
};
