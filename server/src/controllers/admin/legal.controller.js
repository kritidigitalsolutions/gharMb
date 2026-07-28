/**
 * Admin Legal Content Controller
 * Handles administrative reading and updating of legal documents (Terms & Conditions, Privacy Policy).
 */

const LegalContent = require('../../models/legal-content.model');

// @desc    Get legal content by type for Admin
// @route   GET /api/admin/legal/:type
// @access  Private (Admin only)
exports.getLegalContent = async (req, res, next) => {
  try {
    const { type } = req.params;

    // Validate type parameter
    const allowedTypes = ['terms', 'privacy-policy'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `Invalid legal content type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    const legalContent = await LegalContent.findOne({ type }).populate('lastUpdatedBy', 'name email');

    if (!legalContent) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: `No content found for type: ${type}`
      });
    }

    res.status(200).json({
      status: 'success',
      success: true,
      data: {
        legalContent
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or create (upsert) legal content
// @route   PUT /api/admin/legal/:type
// @access  Private (Admin only)
exports.updateLegalContent = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { title, content } = req.body;

    // 1. Validate content type
    const allowedTypes = ['terms', 'privacy-policy'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `Invalid legal content type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    // 2. Validate required title and content
    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Title is required and cannot be empty.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Content is required and cannot be empty.'
      });
    }

    // 3. Upsert content (create if not exists, update if exists)
    const legalContent = await LegalContent.findOneAndUpdate(
      { type },
      {
        title: title.trim(),
        content: content.trim(),
        lastUpdatedBy: req.user._id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('lastUpdatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      success: true,
      message: `${legalContent.title} updated successfully.`,
      data: {
        legalContent
      }
    });
  } catch (error) {
    next(error);
  }
};
