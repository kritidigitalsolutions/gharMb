/**
 * App Static Page Content Controller
 * Handles public retrieval of static documents (About Us, Help & Support).
 */

const PageContent = require('../../models/page-content.model');
const Property = require('../../models/property.model');
const User = require('../../models/user.model');

// Helper to normalize input slug from app
const normalizeType = (slug = '') => {
  const s = String(slug).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (s === 'about' || s === 'aboutus') return 'about-us';
  if (s === 'contact' || s === 'contactus') return 'contact-us';
  if (s === 'help' || s === 'support' || s === 'helpsupport') return 'help-support';
  return slug.toLowerCase().trim();
};

const DEFAULT_PAGE_CONTENT = {
  'about-us': {
    title: 'About GHARMB',
    type: 'about-us',
    headline: 'Making real estate simpler, verified, and more trustworthy.',
    tagline: 'Modern Real-Estate Technology Platform & RERA Verification Hub',
    description:
      'GHARMB is a comprehensive SaaS platform designed to streamline real estate operations. It provides tools for property verification, builder RERA tracking, user directory management, and revenue analytics all in one centralized dashboard.',
    content:
      'GHARMB is a comprehensive SaaS platform designed to streamline real estate operations. It provides tools for property verification, builder RERA tracking, user directory management, and revenue analytics all in one centralized dashboard.',
    mission:
      'To bring 100% transparency and verified trust to the real estate ecosystem by automating compliance checks and empowering stakeholders with actionable property insights.',
    vision:
      "To build India's most trusted, unified real estate digital operating system for property buyers, builders, and licensed brokers.",
    supportEmail: 'support@gharmb.com',
    helpline: '+91 99990 00000',
    headquarters: 'GharMB Corporate Office, Gurugram, NCR, India',
    reraRegistration: '',
    websiteUrl: 'https://gharmb.com/about',
    values: [
      '100% RERA Verified',
      'Lead & Contact Privacy',
      'Zero Broker Fraud',
      'Direct Developer Rates',
      'Smart Token Escrow',
      '24/7 Dedicated Support'
    ]
  },
  'help-support': {
    title: 'Help & Customer Support',
    type: 'help-support',
    content:
      'Need assistance regarding verified listings, token booking, or KYC verification? Reach out to GHARMB customer support at support@gharmb.com or via WhatsApp.',
    supportEmail: 'support@gharmb.com',
    helpline: '+91 99990 00000',
    tollFree: '1800-120-4427',
    whatsapp: '+91 99990 00000',
    workingHours: 'Monday – Saturday: 9:00 AM – 8:00 PM IST'
  },
  'contact-us': {
    title: 'Get in Touch with GharMB',
    type: 'contact-us',
    headline: 'Get in Touch with GharMB',
    subheading:
      'Connect with our real estate specialists for verified listings, builder tracking, and property consultations.',
    content:
      'Have questions about property verification, builder tracking, or partnership opportunities? Reach out to our dedicated advisory team.',
    helpline: '+91 99990 00000',
    tollFree: '1800-120-4427',
    whatsapp: '+91 99990 00000',
    supportEmail: 'support@gharmb.com',
    salesEmail: 'sales@gharmb.com',
    workingHours: 'Mon – Sat: 9:00 AM – 8:00 PM IST',
    weekendSupport: 'Sunday: Emergency WhatsApp Support Only',
    responseSLA: 'Replies in under 15 mins',
    headquarters: {
      address: 'GharMB Corporate Office',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      country: 'India',
      mapsUrl: 'https://maps.google.com/?q=Gurugram+Haryana'
    },
    branches: [],
    socialLinks: {
      linkedin: 'https://linkedin.com/company/gharmb',
      twitter: 'https://twitter.com/gharmb_official',
      instagram: 'https://instagram.com/gharmb_official'
    },
    grievanceOfficer: {
      name: 'Grievance Redressal Officer',
      email: 'grievance@gharmb.com',
      phone: '+91 99990 00000'
    }
  }
};

// @desc    Get static page content by type
// @route   GET /api/pages/:type or /api/user/pages/:type
// @access  Public
exports.getPageContent = async (req, res, next) => {
  try {
    const rawType = req.params.type;
    const type = normalizeType(rawType);

    const allowedTypes = ['about-us', 'help-support', 'contact-us'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: `Invalid page content type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    let pageContent = await PageContent.findOne({ type }).populate('lastUpdatedBy', 'name email');

    // Dynamically compute real platform metrics for about-us
    let liveMetrics = null;
    if (type === 'about-us') {
      try {
        const [liveProps, liveBuilders, cities] = await Promise.all([
          Property.countDocuments({ isLive: true }),
          User.countDocuments({ role: 'builder' }),
          Property.distinct('city')
        ]);
        liveMetrics = {
          verifiedProperties: `${liveProps > 0 ? liveProps : 0}+`,
          registeredBuilders: `${liveBuilders > 0 ? liveBuilders : 0}+`,
          activeCities: `${cities && cities.length > 0 ? cities.length : 1}+`,
          trustScore: '100% Verified'
        };
      } catch (_) {}
    }

    // If not in database, return rich default payload
    if (!pageContent) {
      const fallback = DEFAULT_PAGE_CONTENT[type] || {};
      const metadata = fallback.metadata || { ...fallback };
      if (liveMetrics) {
        fallback.metrics = liveMetrics;
        metadata.metrics = liveMetrics;
      }
      return res.status(200).json({
        status: 'success',
        success: true,
        data: {
          pageContent: {
            ...fallback,
            metadata
          }
        }
      });
    }

    // Merge metadata top-level so both mobile app (reading data.mission/data.helpline)
    // and web (reading data.metadata) get 100% of fields seamlessly
    const plainDoc = pageContent.toObject ? pageContent.toObject() : pageContent;
    const meta = plainDoc.metadata || {};

    const unifiedPayload = {
      ...meta,
      ...plainDoc,
      description: meta.description || plainDoc.content,
      mission: meta.mission || '',
      vision: meta.vision || '',
      headline: meta.headline || plainDoc.title,
      helpline: meta.helpline || '',
      whatsapp: meta.whatsapp || '',
      supportEmail: meta.supportEmail || '',
      workingHours: meta.workingHours || '',
      headquarters: meta.headquarters || '',
      metrics: meta.metrics && Object.keys(meta.metrics).length > 0 ? meta.metrics : (liveMetrics || {}),
      values: meta.values || [],
      metadata: meta
    };

    res.status(200).json({
      status: 'success',
      success: true,
      data: {
        pageContent: unifiedPayload
      }
    });
  } catch (error) {
    next(error);
  }
};
