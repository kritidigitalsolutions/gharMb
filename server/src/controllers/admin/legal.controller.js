/**
 * Admin Legal Content Controller
 * Handles administrative reading, creating, updating, and deleting of legal policies.
 */

const LegalContent = require('../../models/legal-content.model');

const defaultContent = {
  terms: `1. Acceptance of Terms\nBy accessing and using the GHARMB platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. User & Administrator Responsibilities\nAs an authorized user or administrator, you are responsible for maintaining the confidentiality of your account credentials.\n\n3. Data Usage & Modification\nThe platform aggregates real estate data. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.`,
  'privacy-policy': `1. Information We Collect\nWe collect information regarding user actions, property interactions, and system modifications within the GHARMB platform.\n\n2. Security & Compliance\nWe implement industry-grade encryption protocols and strict role-based access control to ensure unauthorized personnel cannot tamper with real estate assets.\n\n3. Third-Party Disclosures\nNo client real estate records will be sold or rented to third-party marketing services.`
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

// Helper to ensure default system policies exist
const ensureSystemPolicies = async (adminId) => {
  const count = await LegalContent.countDocuments();
  if (count === 0) {
    const defaultPolicies = [
      {
        type: 'terms',
        slug: 'terms',
        title: 'Terms of Service',
        shortDescription: 'Terms and conditions governing the access and usage of GharMB services.',
        content: defaultContent.terms,
        status: 'published',
        showInFooter: true,
        displayOrder: 1,
        isSystem: true,
        lastUpdatedBy: adminId
      },
      {
        type: 'privacy-policy',
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        shortDescription: 'Information about how GharMB collects, manages and protects your personal data.',
        content: defaultContent['privacy-policy'],
        status: 'published',
        showInFooter: true,
        displayOrder: 2,
        isSystem: true,
        lastUpdatedBy: adminId
      }
    ];
    for (const p of defaultPolicies) {
      await LegalContent.updateOne(
        { type: p.type },
        { $setOnInsert: p },
        { upsert: true }
      );
    }
  }
};

// @desc    Get all legal policies for Admin
// @route   GET /api/admin/legal/policies
// @access  Private (Admin only)
exports.getAllPolicies = async (req, res, next) => {
  try {
    if (req.user?._id) {
      await ensureSystemPolicies(req.user._id);
    }

    const policies = await LegalContent.find()
      .populate('lastUpdatedBy', 'name email')
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

// @desc    Get legal content by type/slug for Admin
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
        message: 'Invalid legal content type or slug.'
      });
    }

    let legalContent = await LegalContent.findOne({
      $or: [{ type }, { slug: type }]
    }).populate('lastUpdatedBy', 'name email');

    if (!legalContent) {
      // Fallback for terms and privacy-policy
      if (type === 'terms' || type === 'privacy-policy') {
        return res.status(200).json({
          status: 'success',
          success: true,
          data: {
            legalContent: {
              type,
              slug: type,
              title: defaultTitles[type],
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
        message: `Policy with slug '${type}' not found.`
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

// @desc    Create a new dynamic legal policy
// @route   POST /api/admin/legal/policies
// @access  Private (Admin only)
exports.createPolicy = async (req, res, next) => {
  try {
    const { title, slug, shortDescription, content, status, platform, showInFooter, displayOrder } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Policy title is required.'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Policy content is required.'
      });
    }

    const finalSlug = normalizeType(slug || title);
    if (!finalSlug) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'A valid URL slug is required.'
      });
    }

    // Check for duplicate slug
    const existing = await LegalContent.findOne({
      $or: [{ type: finalSlug }, { slug: finalSlug }]
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `A policy with slug '${finalSlug}' already exists.`
      });
    }

    const validPlatform = ['both', 'web', 'app'].includes(platform) ? platform : 'both';

    const newPolicy = await LegalContent.create({
      type: finalSlug,
      slug: finalSlug,
      title: title.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      content: content.trim(),
      status: status === 'draft' ? 'draft' : 'published',
      platform: validPlatform,
      showInFooter: showInFooter !== false,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 10,
      isSystem: false,
      publishedAt: status === 'draft' ? null : new Date(),
      lastUpdatedBy: req.user._id
    });

    await newPolicy.populate('lastUpdatedBy', 'name email');

    res.status(201).json({
      status: 'success',
      success: true,
      message: `Policy '${newPolicy.title}' created successfully.`,
      data: {
        policy: newPolicy,
        legalContent: newPolicy
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or create (upsert) legal content by type/slug
// @route   PUT /api/admin/legal/:type
// @access  Private (Admin only)
exports.updateLegalContent = async (req, res, next) => {
  try {
    const rawType = req.params.type;
    const type = normalizeType(rawType);
    const { title, slug, shortDescription, content, status, platform, showInFooter, displayOrder } = req.body;

    if (!type) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Invalid policy type or slug.'
      });
    }

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

    const isSystemPolicy = (type === 'terms' || type === 'privacy-policy');

    const updatePayload = {
      title: title.trim(),
      content: content.trim(),
      lastUpdatedBy: req.user._id
    };

    if (shortDescription !== undefined) updatePayload.shortDescription = shortDescription.trim();
    if (status !== undefined) updatePayload.status = status;
    if (platform !== undefined && ['both', 'web', 'app'].includes(platform)) {
      updatePayload.platform = platform;
    }
    if (showInFooter !== undefined) updatePayload.showInFooter = Boolean(showInFooter);
    if (displayOrder !== undefined) updatePayload.displayOrder = Number(displayOrder);
    if (status === 'published') updatePayload.publishedAt = new Date();
    if (isSystemPolicy) updatePayload.isSystem = true;

    // Handle optional slug change for non-system policies
    if (slug && !isSystemPolicy) {
      const newSlug = normalizeType(slug);
      if (newSlug && newSlug !== type) {
        const slugExists = await LegalContent.findOne({
          _id: { $ne: req.body._id },
          $or: [{ type: newSlug }, { slug: newSlug }]
        });
        if (slugExists) {
          return res.status(400).json({
            status: 'fail',
            success: false,
            message: `A policy with slug '${newSlug}' already exists.`
          });
        }
        updatePayload.type = newSlug;
        updatePayload.slug = newSlug;
      }
    }

    const legalContent = await LegalContent.findOneAndUpdate(
      { $or: [{ type }, { slug: type }] },
      { $set: updatePayload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate('lastUpdatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      success: true,
      message: `${legalContent.title} updated successfully.`,
      data: {
        legalContent,
        policy: legalContent
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a custom legal policy
// @route   DELETE /api/admin/legal/policies/:id
// @access  Private (Admin only)
exports.deletePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const policy = await LegalContent.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { type: id }, { slug: id }]
    });

    if (!policy) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: 'Policy not found.'
      });
    }

    if (policy.isSystem || policy.type === 'terms' || policy.type === 'privacy-policy') {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'System policies (Terms of Service and Privacy Policy) cannot be deleted.'
      });
    }

    await LegalContent.deleteOne({ _id: policy._id });

    res.status(200).json({
      status: 'success',
      success: true,
      message: `Policy '${policy.title}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

