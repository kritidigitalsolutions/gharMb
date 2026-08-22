/**
 * Admin Legal Content Controller
 * Handles administrative reading and updating of legal documents (Terms & Conditions, Privacy Policy).
 */

const LegalContent = require('../../models/legal-content.model');

const defaultContent = {
  terms: `1. Acceptance of Terms\nBy accessing and using the GHARMB admin platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Administrator Responsibilities\nAs an authorized administrator, you are responsible for maintaining the confidentiality of your account credentials. All actions performed under your account, including property verification approvals and builder suspensions, are logged and audited.\n\n3. Data Usage & Modification\nThe platform aggregates sensitive real estate data. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.`,
  'privacy-policy': `1. Information We Collect\nWe collect information regarding administrator actions, audit trails, IP logs, and system modifications within the GHARMB administrator console.\n\n2. Security & Compliance\nWe implement industry-grade encryption protocols and strict role-based access control (RBAC) to ensure unauthorized personnel cannot tamper with real estate assets.\n\n3. Third-Party Disclosures\nNo administrator or client real estate records will be sold or rented to third-party marketing services.`
};

const defaultTitles = {
  terms: 'Terms of Service',
  'privacy-policy': 'Privacy Policy'
};

const normalizeType = (type) => {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === 'terms' || t === 'terms-conditions' || t === 'terms-and-conditions') return 'terms';
  if (t === 'privacy' || t === 'privacy-policy' || t === 'privacy-and-policy') return 'privacy-policy';
  return null;
};

// @desc    Get legal content by type for Admin
// @route   GET /api/admin/legal/:type
// @access  Private (Admin only)
exports.getLegalContent = async (req, res, next) => {
  try {
    const rawType = req.params.type;
    const type = normalizeType(rawType);

    if (!type) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid legal content type. Must be one of: terms, privacy-policy'
      });
    }

    let legalContent = await LegalContent.findOne({ type }).populate('lastUpdatedBy', 'name email');

    if (!legalContent) {
      return res.status(200).json({
        status: 'success',
        success: true,
        data: {
          legalContent: {
            type,
            title: defaultTitles[type] || (type === 'terms' ? 'Terms of Service' : 'Privacy Policy'),
            content: defaultContent[type] || '',
            updatedAt: new Date()
          }
        }
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
    const rawType = req.params.type;
    const type = normalizeType(rawType);
    const { title, content } = req.body;

    // 1. Validate content type
    if (!type) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid legal content type. Must be one of: terms, privacy-policy'
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
        type,
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
