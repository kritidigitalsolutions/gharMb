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

    let pageContent = await PageContent.findOne({ type }).populate('lastUpdatedBy', 'name email');

    if (!pageContent) {
      const defaultPageContent = {
        'about-us': {
          title: 'About Us',
          type: 'about-us',
          content: 'Welcome to GHARMB, your trusted destination for premium real estate listings, connecting buyers, sellers, tenants, agents, and developers.'
        },
        'help-support': {
          title: 'Help & Support',
          type: 'help-support',
          content: 'Need assistance? Reach out to GHARMB customer support at support@gharmb.com or call our toll-free support line.'
        }
      };

      if (defaultPageContent[type]) {
        return res.status(200).json({
          status: 'success',
          success: true,
          data: {
            pageContent: defaultPageContent[type]
          }
        });
      }

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
