const BlogCategory = require('../../models/blog-category.model');
const Blog = require('../../models/blog.model');

// Helper: generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// @desc    Create a blog category
// @route   POST /api/admin/blog-categories
// @access  Private (Admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category name is required.',
      });
    }

    const slug = generateSlug(name);

    // Check for duplicate
    const existing = await BlogCategory.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });
    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'A category with this name already exists.',
      });
    }

    const category = await BlogCategory.create({
      name: name.trim(),
      slug,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      status: 'success',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all blog categories
// @route   GET /api/admin/blog-categories
// @access  Private (Admin only)
exports.getAllCategories = async (req, res, next) => {
  try {
    const [categories, counts] = await Promise.all([
      BlogCategory.find().sort({ createdAt: -1 }).lean(),
      Blog.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      articleCount: countMap[cat._id.toString()] || 0,
    }));

    res.status(200).json({
      status: 'success',
      results: categoriesWithCount.length,
      data: { categories: categoriesWithCount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a blog category
// @route   PUT /api/admin/blog-categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.slug = generateSlug(name);

      // Check for duplicate (excluding current)
      const existing = await BlogCategory.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: name.trim() }, { slug: updateData.slug }],
      });
      if (existing) {
        return res.status(400).json({
          status: 'fail',
          message: 'A category with this name already exists.',
        });
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const category = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a blog category (with safety check)
// @route   DELETE /api/admin/blog-categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found.',
      });
    }

    // Check if blogs are using this category
    const articleCount = await Blog.countDocuments({ category: req.params.id });

    if (articleCount > 0) {
      // If moveToCategory is provided, reassign articles first
      const { moveToCategory } = req.body;

      if (moveToCategory) {
        const targetCategory = await BlogCategory.findById(moveToCategory);
        if (!targetCategory) {
          return res.status(400).json({
            status: 'fail',
            message: 'Target category for reassignment not found.',
          });
        }

        await Blog.updateMany(
          { category: req.params.id },
          { category: moveToCategory }
        );
      } else {
        return res.status(400).json({
          status: 'fail',
          message: `This category contains ${articleCount} article(s). Please provide moveToCategory to reassign them before deleting.`,
          articleCount,
        });
      }
    }

    await BlogCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete blog categories
// @route   POST /api/admin/blog-categories/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteCategories = async (req, res, next) => {
  try {
    const { ids, moveToCategory } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of category IDs to delete.',
      });
    }

    // Check if any articles exist in the selected categories
    const articleCount = await Blog.countDocuments({ category: { $in: ids } });

    if (articleCount > 0) {
      if (!moveToCategory) {
        return res.status(400).json({
          status: 'fail',
          message: `Selected categories contain ${articleCount} article(s). Please select a target category to reassign them before deleting.`,
          articleCount,
        });
      }

      const targetCategory = await BlogCategory.findById(moveToCategory);
      if (!targetCategory || ids.includes(moveToCategory)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid target category for article reassignment.',
        });
      }

      // Reassign articles
      await Blog.updateMany(
        { category: { $in: ids } },
        { category: moveToCategory }
      );
    }

    const result = await BlogCategory.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} category(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

