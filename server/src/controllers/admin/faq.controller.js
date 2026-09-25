const Faq = require('../../models/faq.model');
const FaqCategory = require('../../models/faq-category.model');

// @desc    Create an FAQ
// @route   POST /api/admin/faqs
// @access  Private (Admin only)
exports.createFaq = async (req, res, next) => {
  try {
    const { question, answer, category, isActive } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Question, answer, and category are required.',
      });
    }

    // Validate category exists
    const categoryDoc = await FaqCategory.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid category.',
      });
    }

    const faq = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      category,
      isActive: isActive !== undefined ? isActive : true,
    });

    await faq.populate('category', 'name slug');

    res.status(201).json({
      status: 'success',
      data: { faq },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all FAQs (admin)
// @route   GET /api/admin/faqs
// @access  Private (Admin only)
exports.getAllFaqs = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const query = {};
    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    const faqs = await Faq.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: faqs.length,
      data: { faqs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an FAQ
// @route   PUT /api/admin/faqs/:id
// @access  Private (Admin only)
exports.updateFaq = async (req, res, next) => {
  try {
    const { question, answer, category, isActive } = req.body;

    const updateData = {};
    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    if (category !== undefined) {
      const categoryDoc = await FaqCategory.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid category.',
        });
      }
      updateData.category = category;
    }

    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!faq) {
      return res.status(404).json({
        status: 'fail',
        message: 'FAQ not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { faq },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an FAQ
// @route   DELETE /api/admin/faqs/:id
// @access  Private (Admin only)
exports.deleteFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        status: 'fail',
        message: 'FAQ not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'FAQ deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete FAQs
// @route   POST /api/admin/faqs/bulk-delete
// @access  Private (Admin only)
exports.bulkDeleteFaqs = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of FAQ IDs to delete.',
      });
    }

    const result = await Faq.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} FAQ(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
