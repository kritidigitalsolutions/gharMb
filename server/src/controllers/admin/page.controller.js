/**
 * Admin Page Content Controller
 * Handles administrative reading and updating of static documents (About Us, Help & Support).
 */

const PageContent = require('../../models/page-content.model');

// @desc    Get static page content by type for Admin
// @route   GET /api/admin/pages/:type
// @access  Private (Admin only)
exports.getPageContent = async (req, res, next) => {
  try {
    const { type } = req.params;

    // Validate type parameter
    const allowedTypes = ['about-us', 'help-support'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `Invalid page content type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    const pageContent = await PageContent.findOne({ type }).populate('lastUpdatedBy', 'name email');

    if (!pageContent) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: `No page content found for type: ${type}`
      });
    }

    res.status(200).json({
      status: 'success',
      success: true,
      data: {
        pageContent
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or create (upsert) static page content
// @route   PUT /api/admin/pages/:type
// @access  Private (Admin only)
exports.updatePageContent = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { title, content } = req.body;

    // 1. Validate content type
    const allowedTypes = ['about-us', 'help-support'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `Invalid page content type. Must be one of: ${allowedTypes.join(', ')}`
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
    const pageContent = await PageContent.findOneAndUpdate(
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
      message: `${pageContent.title} page updated successfully.`,
      data: {
        pageContent
      }
    });
  } catch (error) {
    next(error);
  }
};
