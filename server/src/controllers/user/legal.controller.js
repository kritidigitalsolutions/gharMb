/**
 * App Legal Content Controller
 * Handles public retrieval of legal documents (Terms, Privacy Policy, and dynamic custom policies).
 */

const LegalContent = require('../../models/legal-content.model');

const defaultContent = {
  terms: `1. Acceptance of Terms\nBy accessing and using the GHARMB platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. User Responsibilities\nAs an authorized user, you are responsible for maintaining the confidentiality of your account credentials.\n\n3. Data Usage & Modification\nThe platform aggregates real estate data. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.`,
  'privacy-policy': `1. Information We Collect\nWe collect information regarding user registration, property listings, and system interactions within the GHARMB platform.\n\n2. Security & Compliance\nWe implement industry-grade encryption protocols and role-based access control to safeguard your data.\n\n3. Third-Party Disclosures\nNo user records will be sold or rented to third-party marketing services.`
};

const defaultTitles = {
  terms: 'Terms of Service',
  'privacy-policy': 'Privacy Policy'
};

const normalizeType = (type) => {
  if (!type) return null;
  const t = type.toLowerCase().trim();
  if (t === 'terms' || t === 'terms-conditions' || t === 'terms-and-conditions' || t === 'terms-of-service') return 'terms';
  if (t === 'privacy' || t === 'privacy-policy' || t === 'privacy-and-policy') return 'privacy-policy';
  return t.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// @desc    Get all published legal policies for public/website (optionally filtered by footer and platform)
// @route   GET /api/legal/policies
// @access  Public
exports.getAllPublicPolicies = async (req, res, next) => {
  try {
    const filter = {
      status: { $ne: 'draft' }
    };

    if (req.query.footerOnly === 'true' || req.query.footer === 'true') {
      filter.showInFooter = { $ne: false };
    }

    if (req.query.platform) {
      const p = req.query.platform.toLowerCase().trim();
      if (p === 'web') {
        filter.platform = { $in: ['web', 'both', null, undefined] };
      } else if (p === 'app' || p === 'mobile') {
        filter.platform = { $in: ['app', 'both', null, undefined] };
      }
    }

    const policies = await LegalContent.find(filter)
      .select('title slug type shortDescription status platform showInFooter displayOrder updatedAt publishedAt isSystem')
      .sort({ displayOrder: 1, createdAt: 1 });

    res.status(200).json({
      status: 'success',
      success: true,
      data: {
        policies
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get legal content by type or slug
// @route   GET /api/legal/:type
// @access  Public
exports.getLegalContent = async (req, res, next) => {
  try {
    const rawType = req.params.type;
    const type = normalizeType(rawType);

    // Validate type parameter
    if (!type) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid legal content type or slug.'
      });
    }

    const query = {
      $or: [{ type }, { slug: type }],
      status: { $ne: 'draft' }
    };

    if (req.query.platform === 'web') {
      query.platform = { $in: ['web', 'both', null, undefined] };
    } else if (req.query.platform === 'app' || req.query.platform === 'mobile') {
      query.platform = { $in: ['app', 'both', null, undefined] };
    }

    const legalContent = await LegalContent.findOne(query).populate('lastUpdatedBy', 'name email');

    if (!legalContent) {
      // Fallback for default system policies if DB is empty
      if (type === 'terms' || type === 'privacy-policy') {
        return res.status(200).json({
          status: 'success',
          success: true,
          data: {
            legalContent: {
              type,
              slug: type,
              title: defaultTitles[type] || (type === 'terms' ? 'Terms of Service' : 'Privacy Policy'),
              shortDescription: type === 'terms' ? 'Terms and conditions governing GharMB.' : 'Privacy policy and data protection.',
              content: defaultContent[type] || '',
              status: 'published',
              showInFooter: true,
              displayOrder: type === 'terms' ? 1 : 2,
              isSystem: true,
              updatedAt: new Date()
            }
          }
        });
      }

      return res.status(404).json({
        status: 'fail',
        success: false,
        message: `Legal policy '${type}' not found or is currently in draft.`
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
