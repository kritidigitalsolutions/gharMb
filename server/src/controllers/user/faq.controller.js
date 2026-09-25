const Faq = require('../../models/faq.model');
const FaqCategory = require('../../models/faq-category.model');

// @desc    Get all active FAQ categories
// @route   GET /api/faqs/categories
// @access  Public
exports.getActiveCategories = async (req, res, next) => {
  try {
    const categories = await FaqCategory.find({ isActive: true })
      .sort({ createdAt: 1 }) // Or whatever specific order makes sense
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

// @desc    Get active FAQs (optionally filtered by category)
// @route   GET /api/faqs
// @access  Public
exports.getActiveFaqs = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };

    if (category && category !== 'all' && category !== 'All') {
      // Find the category by slug or name if a string is passed, or by ID
      const catDoc = await FaqCategory.findOne({
        $or: [{ slug: category }, { name: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
        isActive: true
      });
      
      if (catDoc) {
        query.category = catDoc._id;
      } else {
        // If category is passed but not found, return empty
        return res.status(200).json({
          status: 'success',
          results: 0,
          data: { faqs: [] }
        });
      }
    }

    const faqs = await Faq.find(query)
      .populate('category', 'name slug')
      .sort({ sortOrder: 1, createdAt: 1 })
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
