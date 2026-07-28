/**
 * App Legal Content Controller
 * Handles public retrieval of legal documents (Terms & Conditions, Privacy Policy).
 */

const LegalContent = require('../../models/legal-content.model');

// @desc    Get legal content by type
// @route   GET /api/legal/:type
// @access  Public
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
