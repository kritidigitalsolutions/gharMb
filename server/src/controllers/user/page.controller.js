/**
 * App Static Page Content Controller
 * Handles public retrieval of static documents (About Us, Help & Support).
 */

const PageContent = require('../../models/page-content.model');

// @desc    Get static page content by type
// @route   GET /api/pages/:type
// @access  Public
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
