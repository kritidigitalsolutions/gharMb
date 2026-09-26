const mongoose = require('mongoose');
const Blog = require('../../models/blog.model');
const BlogCategory = require('../../models/blog-category.model');

// Helper: query by _id or slug
const findBlogQuery = (param) => {
  if (!param) return { _id: null };
  return mongoose.Types.ObjectId.isValid(param) ? { _id: param } : { slug: param };
};

// Helper: generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Helper: ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const query = { slug };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
    const existing = await Blog.findOne(query);
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// @desc    Create a blog article
// @route   POST /api/admin/blogs
// @access  Private (Admin only)
exports.createBlog = async (req, res, next) => {
  try {
    const {
      title, slug, category, excerpt, content, bannerImage,
      author, readTime, status, isFeatured, tags, seo,
    } = req.body;

    if (!title || !category || !excerpt) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title, category, and excerpt are required.',
      });
    }

    // Validate category exists
    const categoryDoc = await BlogCategory.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid category.',
      });
    }

    let finalSlug = slug ? generateSlug(slug) : generateSlug(title);
    finalSlug = await ensureUniqueSlug(finalSlug);

    const isPublished = status === 'published';

    const blog = await Blog.create({
      title: title.trim(),
      slug: finalSlug,
      category,
      excerpt: excerpt.trim(),
      content: content || '',
      bannerImage: bannerImage || '',
      author: author || 'GharMB',
      readTime: readTime || 5,
      status: status || 'draft',
      isPublished,
      isFeatured: isFeatured || false,
      publishedAt: isPublished ? new Date() : null,
      tags: tags || [],
      seo: seo || {},
    });

    // Populate category for response
    await blog.populate('category', 'name slug');

    res.status(201).json({
      status: 'success',
      data: { blog },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all blog articles (admin - includes drafts)
// @route   GET /api/admin/blogs
// @access  Private (Admin only)
exports.getAllBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, status, search, sort = 'desc' } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status === 'published') query.isPublished = true;
    else if (status === 'draft') query.isPublished = false;

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
        .sort({ createdAt: sort === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-content')
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

// @desc    Get a blog article by ID (admin)
// @route   GET /api/admin/blogs/:id
// @access  Private (Admin only)
exports.getBlogById = async (req, res, next) => {
  try {
    const q = findBlogQuery(req.params.id);
    const blog = await Blog.findOne(q).populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { blog },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a blog article
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin only)
exports.updateBlog = async (req, res, next) => {
  try {
    const {
      title, slug, category, excerpt, content, bannerImage,
      author, readTime, status, isFeatured, tags, seo,
    } = req.body;

    const q = findBlogQuery(req.params.id);
    const existingBlog = await Blog.findOne(q);

    if (!existingBlog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found.',
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (content !== undefined) updateData.content = content;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (author !== undefined) updateData.author = author;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (tags !== undefined) updateData.tags = tags;
    if (seo !== undefined) updateData.seo = seo;

    if (category !== undefined) {
      const categoryDoc = await BlogCategory.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid category.',
        });
      }
      updateData.category = category;
    }

    if (slug !== undefined) {
      let finalSlug = generateSlug(slug);
      finalSlug = await ensureUniqueSlug(finalSlug, existingBlog._id);
      updateData.slug = finalSlug;
    } else if (title !== undefined) {
      if (generateSlug(existingBlog.title) === existingBlog.slug) {
        let finalSlug = generateSlug(title);
        finalSlug = await ensureUniqueSlug(finalSlug, existingBlog._id);
        updateData.slug = finalSlug;
      }
    }

    if (status !== undefined) {
      updateData.status = status;
      updateData.isPublished = status === 'published';
      if (status === 'published' && !existingBlog.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const blog = await Blog.findByIdAndUpdate(existingBlog._id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    res.status(200).json({
      status: 'success',
      data: { blog },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a blog article
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin only)
exports.deleteBlog = async (req, res, next) => {
  try {
    const q = findBlogQuery(req.params.id);
    const blog = await Blog.findOneAndDelete(q);

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog article deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a blog article
// @route   PATCH /api/admin/blogs/:id/publish
// @access  Private (Admin only)
exports.publishBlog = async (req, res, next) => {
  try {
    const q = findBlogQuery(req.params.id);
    const blog = await Blog.findOneAndUpdate(
      q,
      {
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog article published successfully.',
      data: { blog },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish a blog article
// @route   PATCH /api/admin/blogs/:id/unpublish
// @access  Private (Admin only)
exports.unpublishBlog = async (req, res, next) => {
  try {
    const q = findBlogQuery(req.params.id);
    const blog = await Blog.findOneAndUpdate(
      q,
      {
        status: 'draft',
        isPublished: false,
      },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        message: 'Blog article not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog article unpublished successfully.',
      data: { blog },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete blog articles
// @route   POST /api/admin/blogs/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteBlogs = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of article IDs to delete.',
      });
    }

    const result = await Blog.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} article(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update status (publish/unpublish)
// @route   PATCH /api/admin/blogs/bulk-status
// @access  Private (Admin only)
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of article IDs.',
      });
    }

    const isPublished = status === 'published';
    const updateData = {
      status,
      isPublished,
    };
    if (isPublished) {
      updateData.publishedAt = new Date();
    }

    const result = await Blog.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} article(s) updated to ${status}.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder blogs
// @route   PUT /api/admin/blogs/reorder
// @access  Private (Admin only)
exports.reorderBlogs = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, sortOrder }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ status: 'fail', message: 'items array is required' });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { sortOrder: item.sortOrder }
      }
    }));

    if (bulkOps.length > 0) {
      await Blog.bulkWrite(bulkOps);
    }

    res.status(200).json({
      status: 'success',
      message: 'Reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

