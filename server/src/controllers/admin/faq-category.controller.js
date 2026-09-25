const FaqCategory = require('../../models/faq-category.model');
const Faq = require('../../models/faq.model');

// Helper: generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// @desc    Create a faq category
// @route   POST /api/admin/faq-categories
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
    const existing = await FaqCategory.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });
    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'A category with this name already exists.',
      });
    }

    const category = await FaqCategory.create({
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

// @desc    Get all faq categories
// @route   GET /api/admin/faq-categories
// @access  Private (Admin only)
exports.getAllCategories = async (req, res, next) => {
  try {
    const [categories, counts] = await Promise.all([
      FaqCategory.find().sort({ createdAt: -1 }).lean(),
      Faq.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      faqCount: countMap[cat._id.toString()] || 0,
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

// @desc    Update a faq category
// @route   PUT /api/admin/faq-categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.slug = generateSlug(name);

      // Check for duplicate (excluding current)
      const existing = await FaqCategory.findOne({
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

    const category = await FaqCategory.findByIdAndUpdate(
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

// @desc    Delete a faq category (with safety check)
// @route   DELETE /api/admin/faq-categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await FaqCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found.',
      });
    }

    // Check if faqs are using this category
    const faqCount = await Faq.countDocuments({ category: req.params.id });

    if (faqCount > 0) {
      // If moveToCategory is provided, reassign faqs first
      const { moveToCategory } = req.body;

      if (moveToCategory) {
        const targetCategory = await FaqCategory.findById(moveToCategory);
        if (!targetCategory) {
          return res.status(400).json({
            status: 'fail',
            message: 'Target category for reassignment not found.',
          });
        }

        await Faq.updateMany(
          { category: req.params.id },
          { category: moveToCategory }
        );
      } else {
        return res.status(400).json({
          status: 'fail',
          message: `This category contains ${faqCount} FAQ(s). Please provide moveToCategory to reassign them before deleting.`,
          faqCount,
        });
      }
    }

    await FaqCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete faq categories
// @route   POST /api/admin/faq-categories/bulk-delete
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

    // Check if any faqs exist in the selected categories
    const faqCount = await Faq.countDocuments({ category: { $in: ids } });

    if (faqCount > 0) {
      if (!moveToCategory) {
        return res.status(400).json({
          status: 'fail',
          message: `Selected categories contain ${faqCount} FAQ(s). Please select a target category to reassign them before deleting.`,
          faqCount,
        });
      }

      const targetCategory = await FaqCategory.findById(moveToCategory);
      if (!targetCategory || ids.includes(moveToCategory)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid target category for FAQ reassignment.',
        });
      }

      // Reassign faqs
      await Faq.updateMany(
        { category: { $in: ids } },
        { category: moveToCategory }
      );
    }

    const result = await FaqCategory.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} category(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
