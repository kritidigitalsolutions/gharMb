/**
 * Admin Service Catalog & Offerings Controller
 * Manages platform offerings, pricing packages, and partner lists for
 * Loans, Interiors, Movers, and Legal services.
 */

const ServiceOffering = require('../../models/service-offering.model');

// Default initial catalog data to seed on first launch if empty
const DEFAULT_CATALOG_ITEMS = [
  // ── LEGAL SERVICES ──
  {
    category: 'Legal',
    title: 'Sale Deed Drafting',
    subtitle: 'Lawyer prepares your customized registered sale agreement',
    description: 'Expert property advocates review titles and draft your formal conveyance deed.',
    price: 2999,
    priceDisplay: '₹2,999',
    badge: 'Popular',
    features: ['Lawyer Drafted', 'Govt Compliant', 'Revisions Included', 'Draft in 24 Hours'],
    partners: ['Adv. M.K. Shinde', 'LawDesk Property Advisors', 'LexJuris Legal Associates'],
    order: 1,
    isActive: true,
  },
  {
    category: 'Legal',
    title: 'Title Search & Verification',
    subtitle: 'Check for ownership chain, legal disputes & bank mortgage dues',
    description: '30-year revenue and registry audit to confirm clear and marketable title.',
    price: 1999,
    priceDisplay: '₹1,999',
    badge: 'Essential',
    features: ['30-Year Search', 'Encumbrance Certificate Check', 'Litigation Audit', 'Written Legal Opinion'],
    partners: ['LawDesk Property Advisors', 'Chambers of R.N. Joshi'],
    order: 2,
    isActive: true,
  },
  {
    category: 'Legal',
    title: 'Property Registration Support',
    subtitle: 'Complete registrar office slot booking & legal physical escort',
    description: 'Sub-registrar coordination, challan payment, slot booking, and spot presence.',
    price: 4999,
    priceDisplay: '₹4,999',
    badge: 'Hassle-Free',
    features: ['Slot Booking', 'Challan Assistance', 'Lawyer On-Site', 'Document Delivery'],
    partners: ['Adv. M.K. Shinde', 'LexJuris Legal Associates'],
    order: 3,
    isActive: true,
  },
  {
    category: 'Legal',
    title: 'Power of Attorney (PoA)',
    subtitle: 'Drafting & notarization for NRI, absent owner or elder cases',
    description: 'Special or General Power of Attorney drafting with consular and SDM guidance.',
    price: 3499,
    priceDisplay: '₹3,499',
    badge: '',
    features: ['NRI Support', 'Notary Guidance', 'Specific Clause Customization'],
    partners: ['LawDesk Property Advisors', 'Chambers of R.N. Joshi'],
    order: 4,
    isActive: true,
  },
  {
    category: 'Legal',
    title: 'Agreement Verification',
    subtitle: 'Audit builder-buyer agreement or tenant deed before signing',
    description: 'Comprehensive scrutiny to detect unfair builder clauses and forfeiture terms.',
    price: 3499,
    priceDisplay: '₹3,499',
    badge: '',
    features: ['Clause-by-Clause Review', 'Risk Highlight Report', 'Direct Lawyer Call'],
    partners: ['LexJuris Legal Associates', 'Adv. M.K. Shinde'],
    order: 5,
    isActive: true,
  },

  // ── PACKERS & MOVERS ──
  {
    category: 'Movers',
    title: 'SafeMove Packers Standard',
    subtitle: 'Dedicated truck, verified crew, transit insurance up to ₹2L',
    description: 'Ideal for 1 BHK to 3 BHK intercity and intracity relocation with multi-layer packing.',
    price: 8500,
    priceDisplay: '₹8,500 est.',
    badge: 'Top Rated',
    features: ['Multi-layer Bubble Wrap', 'Dismantling & Reassembly', 'Goods Insured up to ₹2L', 'On-time Delivery Guarantee'],
    partners: ['SafeMove Packers', 'Agarwal Premium Shifting'],
    order: 1,
    isActive: true,
  },
  {
    category: 'Movers',
    title: 'QuickShift Movers Economy',
    subtitle: 'Express loading and transit across Delhi NCR & metros',
    description: 'Fast, budget-friendly relocation for apartments and shared flats.',
    price: 7200,
    priceDisplay: '₹7,200 est.',
    badge: 'Value',
    features: ['Same-Day Move', 'Trained Porters', 'GPS Tracked Truck', 'Zero Hidden Fees'],
    partners: ['QuickShift Movers', 'Porter Enterprise'],
    order: 2,
    isActive: true,
  },
  {
    category: 'Movers',
    title: 'ReliCargo Premium Relocation',
    subtitle: 'VIP white-glove packing for delicate glassware, electronics & furniture',
    description: 'Specialized crating and dedicated relocation executive for stress-free moves.',
    price: 12000,
    priceDisplay: '₹12,000 est.',
    badge: 'White Glove',
    features: ['Wooden Crating', 'Appliance Disconnect/Connect', 'Unpacking & Setup Assistance', 'Dedicated Move Manager'],
    partners: ['ReliCargo Services', 'UrbanMove Intercity'],
    order: 3,
    isActive: true,
  },

  // ── HOME INTERIOR ──
  {
    category: 'Interior',
    title: 'Essential Home Fitout (Basic)',
    subtitle: 'Clean modular woodwork for comfortable modern living',
    description: 'Modular kitchen, master bedroom wardrobe, TV unit, and premium hardware fittings.',
    price: 250000,
    priceDisplay: '₹2.5 Lakhs',
    badge: 'Starter',
    features: ['Modular Kitchen (BWP Ply)', 'Master Bedroom Wardrobe', 'Living Room TV Unit', '1-Year Warranty', '3D Design Preview'],
    partners: ['HomeLane Studio', 'Urban Woodcrafts Delhi/NCR'],
    order: 1,
    isActive: true,
  },
  {
    category: 'Interior',
    title: 'Modern Living Fitout (Premium)',
    subtitle: 'Full-home design with false ceiling, modular units & ambient lighting',
    description: 'Complete interior design including all bedrooms, foyer, premium finishes, and cove lights.',
    price: 500000,
    priceDisplay: '₹5.0 Lakhs',
    badge: 'Most Popular',
    features: ['All Rooms Modular Wardrobes', 'Acrylic Kitchen Shutters', 'False Ceiling with LED Coves', 'Accent Wallpaper Wall', '10-Year Material Warranty'],
    partners: ['Studio Luxe Interiors', 'Livspace Certified Partner'],
    order: 2,
    isActive: true,
  },
  {
    category: 'Interior',
    title: 'Architectural Luxury Suite',
    subtitle: 'High-end bespoke custom interiors, veneers, marble & smart lighting',
    description: 'Tailor-made design by senior architects with Italian finishes, custom automation, and wall panelling.',
    price: 1000000,
    priceDisplay: '₹10.0 Lakhs',
    badge: 'Ultra Luxury',
    features: ['Senior Architect Assigned', 'Italian Marble / Veneer Work', 'Smart Home Lighting Integration', 'Full Furniture & Soft Furnishings', 'Dedicated Site Supervisor'],
    partners: ['Studio Luxe Interiors', 'DecorSpace Mumbai'],
    order: 3,
    isActive: true,
  },
];

// Helper to seed if empty and purge loan offerings
const autoSeedIfEmpty = async () => {
  // Purge any legacy loan offerings
  await ServiceOffering.deleteMany({ category: 'Loan' });

  const count = await ServiceOffering.countDocuments();
  if (count === 0) {
    await ServiceOffering.insertMany(DEFAULT_CATALOG_ITEMS);
  }
};

// @desc    Get all service offerings with filters
// @route   GET /api/admin/service-catalog
// @access  Private (Admin only)
exports.getAllOfferings = async (req, res, next) => {
  try {
    await autoSeedIfEmpty();

    const { category, isActive, search } = req.query;
    const filter = {
      category: { $ne: 'Loan' }
    };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (isActive !== undefined && isActive !== 'All') {
      filter.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { title: regex },
        { subtitle: regex },
        { description: regex },
        { priceDisplay: regex },
        { badge: regex },
        { partners: regex }
      ];
    }

    const [offerings, totalCount, interiorCount, moversCount, legalCount] = await Promise.all([
      ServiceOffering.find(filter).sort({ order: 1, createdAt: -1 }),
      ServiceOffering.countDocuments({ category: { $ne: 'Loan' } }),
      ServiceOffering.countDocuments({ category: 'Interior' }),
      ServiceOffering.countDocuments({ category: 'Movers' }),
      ServiceOffering.countDocuments({ category: 'Legal' })
    ]);

    res.status(200).json({
      status: 'success',
      results: offerings.length,
      counts: {
        total: totalCount,
        interior: interiorCount,
        movers: moversCount,
        legal: legalCount
      },
      data: {
        offerings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service offering
// @route   GET /api/admin/service-catalog/:id
// @access  Private (Admin only)
exports.getOfferingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offering = await ServiceOffering.findById(id);

    if (!offering) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service offering found with that ID.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        offering
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service offering
// @route   POST /api/admin/service-catalog
// @access  Private (Admin only)
exports.createOffering = async (req, res, next) => {
  try {
    const {
      category,
      title,
      subtitle,
      description,
      price,
      priceDisplay,
      badge,
      features,
      partners,
      isActive,
      order,
      meta
    } = req.body;

    if (!category || !title) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category and title are required.'
      });
    }

    const cleanFeatures = Array.isArray(features) 
      ? features.map(f => String(f).trim()).filter(Boolean)
      : typeof features === 'string'
      ? features.split(',').map(f => f.trim()).filter(Boolean)
      : [];

    const cleanPartners = Array.isArray(partners)
      ? partners.map(p => String(p).trim()).filter(Boolean)
      : typeof partners === 'string'
      ? partners.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const offering = await ServiceOffering.create({
      category,
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      description: description?.trim() || '',
      price: Number(price) || 0,
      priceDisplay: priceDisplay?.trim() || (price ? `₹${Number(price).toLocaleString('en-IN')}` : 'Contact for Quote'),
      badge: badge?.trim() || '',
      features: cleanFeatures,
      partners: cleanPartners,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: Number(order) || 0,
      meta: meta || {}
    });

    res.status(201).json({
      status: 'success',
      message: 'Service offering created successfully.',
      data: {
        offering
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service offering
// @route   PATCH /api/admin/service-catalog/:id
// @access  Private (Admin only)
exports.updateOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offering = await ServiceOffering.findById(id);

    if (!offering) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service offering found with that ID.'
      });
    }

    const {
      category,
      title,
      subtitle,
      description,
      price,
      priceDisplay,
      badge,
      features,
      partners,
      isActive,
      order,
      meta
    } = req.body;

    if (category) offering.category = category;
    if (title) offering.title = title.trim();
    if (subtitle !== undefined) offering.subtitle = subtitle.trim();
    if (description !== undefined) offering.description = description.trim();
    if (price !== undefined) offering.price = Number(price) || 0;
    if (priceDisplay !== undefined) offering.priceDisplay = priceDisplay.trim();
    if (badge !== undefined) offering.badge = badge.trim();

    if (features !== undefined) {
      offering.features = Array.isArray(features) 
        ? features.map(f => String(f).trim()).filter(Boolean)
        : typeof features === 'string'
        ? features.split(',').map(f => f.trim()).filter(Boolean)
        : [];
    }

    if (partners !== undefined) {
      offering.partners = Array.isArray(partners)
        ? partners.map(p => String(p).trim()).filter(Boolean)
        : typeof partners === 'string'
        ? partners.split(',').map(p => p.trim()).filter(Boolean)
        : [];
    }

    if (isActive !== undefined) offering.isActive = Boolean(isActive);
    if (order !== undefined) offering.order = Number(order) || 0;
    if (meta !== undefined) offering.meta = meta;

    await offering.save();

    res.status(200).json({
      status: 'success',
      message: 'Service offering updated successfully.',
      data: {
        offering
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service offering
// @route   DELETE /api/admin/service-catalog/:id
// @access  Private (Admin only)
exports.deleteOffering = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offering = await ServiceOffering.findByIdAndDelete(id);

    if (!offering) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service offering found with that ID.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Service offering deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset / Seed default catalog
// @route   POST /api/admin/service-catalog/seed
// @access  Private (Admin only)
exports.seedDefaultCatalog = async (req, res, next) => {
  try {
    const existing = await ServiceOffering.countDocuments();
    if (existing > 0 && req.query.force !== 'true') {
      return res.status(200).json({
        status: 'success',
        message: 'Catalog already populated. Pass ?force=true to wipe and re-seed defaults.'
      });
    }

    if (req.query.force === 'true') {
      await ServiceOffering.deleteMany({});
    }

    const seeded = await ServiceOffering.insertMany(DEFAULT_CATALOG_ITEMS);

    res.status(200).json({
      status: 'success',
      message: `Successfully seeded ${seeded.length} default service offerings.`,
      results: seeded.length
    });
  } catch (error) {
    next(error);
  }
};
