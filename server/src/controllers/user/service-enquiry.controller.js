/**
 * User & App Service Enquiry Controller
 * Handles customer inquiries for:
 * 1. Packers & Movers Relocation
 * 2. Legal & Property Verification Services
 * 3. Interior Design & Fitouts
 * 4. General / Loan Services
 *
 * All inquiries are routed to Admin and trigger in-app Admin notifications.
 */

const ServiceRequest = require('../../models/service-request.model');
const ServiceOffering = require('../../models/service-offering.model');
const User = require('../../models/user.model');
const { notifyAdmin } = require('../../utils/adminNotification.helper');

// Catalog Configurations for App & Web pages
const SERVICE_CATALOGS = {
  movers: {
    title: 'Packers & movers',
    subtitle: 'Verified · insured · on-time',
    headerBadge: 'Get quotes in 2 minutes',
    bhkOptions: [
      '1 RK / 1 BHK',
      '2 BHK',
      '3 BHK',
      '4 BHK+',
      'Villa / Independent House',
      'Few Items / Mini Truck',
    ],
    verifiedMovers: [
      {
        id: 'safemove',
        name: 'SafeMove Packers',
        rating: 4.8,
        completedMoves: '700+ movers',
        coverage: 'Noida & Delhi NCR',
        baseEstimate: 8500,
        priceDisplay: '₹8,500 est.',
      },
      {
        id: 'quickshift',
        name: 'QuickShift Movers',
        rating: 4.6,
        completedMoves: '500+ movers',
        coverage: 'pan NCR',
        baseEstimate: 7200,
        priceDisplay: '₹7,200 est.',
      },
      {
        id: 'relicargo',
        name: 'ReliCargo Services',
        rating: 4.5,
        completedMoves: '300+ movers',
        coverage: 'NCR',
        baseEstimate: 5800,
        priceDisplay: '₹5,800 est.',
      },
    ],
    guarantees: [
      'All movers are verified',
      'Goods insured up to ₹2L',
      'No hidden charges',
    ],
  },
  legal: {
    title: 'Legal services',
    subtitle: 'Safe · verified · expert lawyers',
    verifiedBadge: {
      title: 'GharMB Verified',
      subtitle: 'All our legal partners are verified and experienced professionals',
    },
    legalServices: [
      {
        id: 'sale-deed',
        title: 'Sale deed drafting',
        subtitle: 'Lawyer prepares your sale agreement',
        price: 2999,
        priceDisplay: '₹2,999',
      },
      {
        id: 'title-search',
        title: 'Title search & verification',
        subtitle: 'Check for disputes / legal dues',
        price: 1999,
        priceDisplay: '₹1,999',
      },
      {
        id: 'property-registration',
        title: 'Property registration',
        subtitle: 'Complete registrar office support',
        price: 4999,
        priceDisplay: '₹4,999',
      },
      {
        id: 'stamp-duty',
        title: 'Stamp duty calculation',
        subtitle: 'State-specific accurate estimate',
        price: 0,
        priceDisplay: 'Free',
      },
      {
        id: 'power-of-attorney',
        title: 'Power of attorney',
        subtitle: 'NRI or absent owner cases',
        price: 3499,
        priceDisplay: '₹3,499',
      },
      {
        id: 'agreement-verification',
        title: 'Agreement Verification',
        subtitle: 'Verify any property agreement',
        price: 3499,
        priceDisplay: '₹3,499',
      },
    ],
    features: [
      { id: 'secure', title: 'Secure Process' },
      { id: 'lawyers', title: 'Expert Lawyers' },
      { id: 'pricing', title: 'No Hidden Charges' },
      { id: 'delivery', title: 'Quick Delivery' },
    ],
  },
  interior: {
    title: 'Interior design',
    subtitle: 'Transform your new home',
    styles: [
      {
        id: 'all',
        name: 'All styles',
        startingPrice: 'From ₹1L',
      },
      {
        id: 'modern',
        name: 'Modern',
        startingPrice: 'From ₹1L',
        gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      },
      {
        id: 'minimal',
        name: 'Minimal',
        startingPrice: 'From ₹2L',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        id: 'classic',
        name: 'Classic',
        startingPrice: 'From ₹5L',
        gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      },
      {
        id: 'luxury',
        name: 'Luxury',
        startingPrice: 'From ₹10L',
        gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
      },
    ],
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: '₹2.5 Lakhs',
        description: 'Essential design for comfortable living',
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '₹5.0 Lakhs',
        description: 'Stylish design with premium quality Luxury',
      },
      {
        id: 'luxury',
        name: 'Luxury',
        price: '₹10.0 Lakhs',
        description: 'High-end luxury custom interiors',
      },
    ],
    inclusions: [
      { id: '3d', title: 'Free 3D Design' },
      { id: 'materials', title: 'Material Selection' },
      { id: 'delivery', title: 'On-time Delivery' },
      { id: 'warranty', title: '1 Year Warranty' },
    ],
    stats: '1000+ Homes Designed',
  },
};

// Standard Default Milestones by Service Type
const getDefaultMilestones = (serviceType) => {
  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  switch (serviceType) {
    case 'Movers':
      return [
        { stage: 'Moving Quote Requested', date: todayStr, status: 'done' },
        { stage: 'Inventory & Route Survey', date: 'In Progress', status: 'active' },
        { stage: 'Advance Token & Schedule Confirmed', date: 'Pending', status: 'pending' },
        { stage: 'Packing, Transit & Safe Delivery', date: 'Pending', status: 'pending' },
      ];
    case 'Legal':
      return [
        { stage: 'Consultation Booked', date: todayStr, status: 'done' },
        { stage: 'Revenue Records & Encumbrance Audit', date: 'In Progress', status: 'active' },
        { stage: 'Legal Title Opinion Drafted', date: 'Pending', status: 'pending' },
        { stage: 'Sub-Registrar Slot & Registration', date: 'Pending', status: 'pending' },
      ];
    case 'Interior':
      return [
        { stage: 'Consultation Booked', date: todayStr, status: 'done' },
        { stage: 'Site Measurement & Walkthrough', date: 'Scheduled', status: 'active' },
        { stage: '3D Concept & BOQ Quotation', date: 'Pending', status: 'pending' },
        { stage: 'Execution & Final Handover', date: 'Pending', status: 'pending' },
      ];
    case 'Loan':
      return [
        { stage: 'Request Logged', date: todayStr, status: 'done' },
        { stage: 'KYC & Income Proof Collected', date: 'In Review', status: 'active' },
        { stage: 'Bank Processing & Underwriting', date: 'Pending', status: 'pending' },
        { stage: 'Sanction & Disbursement', date: 'Pending', status: 'pending' },
      ];
    default:
      return [
        { stage: 'Inquiry Logged', date: todayStr, status: 'done' },
        { stage: 'Admin Review & Assignment', date: 'In Progress', status: 'active' },
        { stage: 'Execution & Close', date: 'Pending', status: 'pending' },
      ];
  }
};

// Generate tracking ID
const generateServiceId = (serviceType) => {
  const prefix =
    serviceType === 'Loan'
      ? 'SRV-LN'
      : serviceType === 'Interior'
      ? 'SRV-INT'
      : serviceType === 'Movers'
      ? 'SRV-MOV'
      : 'SRV-LEG';
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
};

// Detect client platform
const resolveSource = (req) => {
  if (req.body.source && ['app', 'web', 'admin', 'direct'].includes(req.body.source.toLowerCase())) {
    return req.body.source.toLowerCase();
  }
  const clientPlatform = (req.headers['x-client-platform'] || req.headers['platform'] || '').toLowerCase();
  if (clientPlatform.includes('app') || clientPlatform.includes('flutter') || clientPlatform.includes('react-native') || clientPlatform.includes('mobile')) {
    return 'app';
  }
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin.includes('gharmb.com') || origin.includes('localhost') || origin.includes('vercel.app')) {
    return 'web';
  }
  return 'app';
};

// @desc    Get dynamic service catalogs for Packers & Movers, Legal, and Interior design
// @route   GET /api/services/catalogs
// @access  Public
exports.getServiceCatalogs = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Fetch dynamic active offerings from MongoDB
    const dynamicOfferings = await ServiceOffering.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

    // Build dynamic catalog merged with default schema
    const liveCatalogs = JSON.parse(JSON.stringify(SERVICE_CATALOGS));

    if (dynamicOfferings.length > 0) {
      // 1. Legal
      const legalItems = dynamicOfferings.filter(o => o.category === 'Legal');
      if (legalItems.length > 0) {
        liveCatalogs.legal.legalServices = legalItems.map(item => ({
          id: item._id,
          title: item.title,
          subtitle: item.subtitle,
          price: item.price,
          priceDisplay: item.priceDisplay,
          badge: item.badge,
          features: item.features,
          partners: item.partners
        }));
      }

      // 2. Movers
      const moverItems = dynamicOfferings.filter(o => o.category === 'Movers');
      if (moverItems.length > 0) {
        liveCatalogs.movers.verifiedMovers = moverItems.map(item => ({
          id: item._id,
          name: item.title,
          rating: item.meta?.rating || 4.8,
          completedMoves: item.meta?.completedMoves || '500+ moves',
          coverage: item.meta?.coverage || item.subtitle || 'Delhi NCR & Metros',
          baseEstimate: item.price,
          priceDisplay: item.priceDisplay,
          features: item.features
        }));
      }

      // 3. Interior
      const interiorItems = dynamicOfferings.filter(o => o.category === 'Interior');
      if (interiorItems.length > 0) {
        liveCatalogs.interior.packages = interiorItems.map(item => ({
          id: item._id,
          name: item.title,
          price: item.priceDisplay,
          description: item.subtitle || item.description,
          features: item.features
        }));
      }
    }

    if (category && liveCatalogs[category.toLowerCase()]) {
      return res.status(200).json({
        status: 'success',
        data: {
          category: category.toLowerCase(),
          catalog: liveCatalogs[category.toLowerCase()],
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        catalogs: liveCatalogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Packers & Movers enquiry
// @route   POST /api/services/movers/enquiry
// @access  Public (Optional User Auth)
exports.createMoversEnquiry = async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      moveFrom,
      moveTo,
      shiftingDate,
      bhkType,
      selectedMover,
      scope,
      notes,
    } = req.body;

    const resolvedName = (clientName || req.user?.name || '').trim();
    const resolvedPhone = (clientPhone || req.user?.phone || '').trim();
    const resolvedEmail = (clientEmail || req.user?.email || '').trim().toLowerCase();

    if (!resolvedName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client name is required.',
      });
    }

    if (!resolvedPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Contact phone number is required.',
      });
    }

    if (!moveFrom || !moveFrom.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Move from (pickup location) is required.',
      });
    }

    if (!moveTo || !moveTo.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Move to (destination location) is required.',
      });
    }

    // Determine estimated quote based on selected mover if available
    let quotation = 'Under Review';
    let quotationSubtext = 'Final Quote Pending Survey';
    const foundMover = SERVICE_CATALOGS.movers.verifiedMovers.find(
      (m) => m.name.toLowerCase() === (selectedMover || '').toLowerCase()
    );
    if (foundMover) {
      quotation = foundMover.priceDisplay;
      quotationSubtext = 'Estimated base price';
    }

    const serviceRequestId = generateServiceId('Movers');
    const source = resolveSource(req);
    const locationStr = `${moveFrom.trim()} → ${moveTo.trim()}`;
    const serviceTitle = selectedMover
      ? `Packers & Movers - ${selectedMover.trim()}`
      : `Packers & Movers (${bhkType || 'Relocation'})`;

    const service = await ServiceRequest.create({
      serviceRequestId,
      serviceType: 'Movers',
      serviceName: serviceTitle,
      client: req.user?._id || undefined,
      clientName: resolvedName,
      clientPhone: resolvedPhone,
      clientEmail: resolvedEmail,
      location: locationStr,
      moveFrom: moveFrom.trim(),
      moveTo: moveTo.trim(),
      shiftingDate: shiftingDate?.trim() || 'Flexible',
      bhkType: bhkType?.trim() || '3 BHK',
      selectedMover: selectedMover?.trim() || '',
      assignedPartner: selectedMover?.trim() || '',
      propertySize: bhkType?.trim() || '',
      scope: Array.isArray(scope) ? scope : [],
      quotation,
      quotationSubtext,
      status: 'In Progress',
      timeline: getDefaultMilestones('Movers'),
      source,
      notes: notes?.trim() || `Moving enquiry from ${source.toUpperCase()}`,
      notesHistory: [
        {
          text: `Inquiry submitted via ${source.toUpperCase()} for ${bhkType || 'Home'} shifting.`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: resolvedName,
          createdAt: new Date(),
        },
      ],
    });

    // Notify Admin Panel
    await notifyAdmin({
      title: `New Packers & Movers Enquiry (${serviceRequestId})`,
      message: `${resolvedName} requested moving quote from "${moveFrom.trim()}" to "${moveTo.trim()}" (${bhkType || '3 BHK'}). Contact: ${resolvedPhone}`,
      type: 'enquiry',
      metadata: {
        serviceRequestId: service._id,
        serviceRequestIdCode: serviceRequestId,
        serviceType: 'Movers',
        clientDetails: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
        customLink: '/admin/services',
      },
      senderId: req.user?._id || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Packers & Movers inquiry submitted successfully. Our team will contact you shortly with final quotes.',
      data: {
        serviceRequestId: service.serviceRequestId,
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Legal Services enquiry / consultation booking
// @route   POST /api/services/legal/enquiry
// @access  Public (Optional User Auth)
exports.createLegalEnquiry = async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      legalServiceType,
      serviceName,
      propertyRef,
      location,
      consultationDate,
      notes,
    } = req.body;

    const resolvedName = (clientName || req.user?.name || '').trim();
    const resolvedPhone = (clientPhone || req.user?.phone || '').trim();
    const resolvedEmail = (clientEmail || req.user?.email || '').trim().toLowerCase();

    if (!resolvedName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client name is required.',
      });
    }

    if (!resolvedPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Contact phone number is required.',
      });
    }

    const targetLegalType = (legalServiceType || serviceName || 'General Consultation').trim();

    // Check pricing catalog
    let quotation = 'Free Consultation';
    let quotationSubtext = 'First consultation free';
    const foundLegal = SERVICE_CATALOGS.legal.legalServices.find(
      (s) => s.title.toLowerCase() === targetLegalType.toLowerCase()
    );
    if (foundLegal) {
      quotation = foundLegal.priceDisplay;
      quotationSubtext = foundLegal.subtitle;
    }

    const serviceRequestId = generateServiceId('Legal');
    const source = resolveSource(req);
    const serviceTitle = `Legal - ${targetLegalType}`;

    const service = await ServiceRequest.create({
      serviceRequestId,
      serviceType: 'Legal',
      serviceName: serviceTitle,
      client: req.user?._id || undefined,
      clientName: resolvedName,
      clientPhone: resolvedPhone,
      clientEmail: resolvedEmail,
      location: location?.trim() || 'India',
      propertyRef: propertyRef?.trim() || 'General Property Case',
      legalServiceType: targetLegalType,
      legalServiceScope: targetLegalType,
      consultationDate: consultationDate?.trim() || 'Immediate / Callback',
      quotation,
      quotationSubtext,
      status: 'In Progress',
      timeline: getDefaultMilestones('Legal'),
      source,
      notes: notes?.trim() || `Legal service consultation for ${targetLegalType}`,
      notesHistory: [
        {
          text: `Inquiry registered for ${targetLegalType} via ${source.toUpperCase()}.`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: resolvedName,
          createdAt: new Date(),
        },
      ],
    });

    // Notify Admin
    await notifyAdmin({
      title: `New Legal Consultation Request (${serviceRequestId})`,
      message: `${resolvedName} requested legal consultation for "${targetLegalType}". Contact: ${resolvedPhone}`,
      type: 'enquiry',
      metadata: {
        serviceRequestId: service._id,
        serviceRequestIdCode: serviceRequestId,
        serviceType: 'Legal',
        clientDetails: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
        customLink: '/admin/services',
      },
      senderId: req.user?._id || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Legal service consultation booked successfully. An expert lawyer will contact you shortly.',
      data: {
        serviceRequestId: service.serviceRequestId,
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Interior Design consultation booking
// @route   POST /api/services/interior/enquiry
// @access  Public (Optional User Auth)
exports.createInteriorEnquiry = async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      designStyle,
      packageSelected,
      bhkType,
      budgetRange,
      location,
      consultationDate,
      scope,
      notes,
    } = req.body;

    const resolvedName = (clientName || req.user?.name || '').trim();
    const resolvedPhone = (clientPhone || req.user?.phone || '').trim();
    const resolvedEmail = (clientEmail || req.user?.email || '').trim().toLowerCase();

    if (!resolvedName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client name is required.',
      });
    }

    if (!resolvedPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Contact phone number is required.',
      });
    }

    const selectedStyle = designStyle?.trim() || 'Modern';
    const selectedPkg = packageSelected?.trim() || 'Premium';

    // Pricing lookup
    let quotation = 'Free Consultation';
    let quotationSubtext = 'Design consultation & 3D layout';
    const foundPkg = SERVICE_CATALOGS.interior.packages.find(
      (p) => p.name.toLowerCase() === selectedPkg.toLowerCase()
    );
    if (foundPkg) {
      quotation = foundPkg.price;
      quotationSubtext = foundPkg.description;
    }

    const serviceRequestId = generateServiceId('Interior');
    const source = resolveSource(req);
    const serviceTitle = `Interior Design - ${selectedStyle} (${selectedPkg} Package)`;

    const service = await ServiceRequest.create({
      serviceRequestId,
      serviceType: 'Interior',
      serviceName: serviceTitle,
      client: req.user?._id || undefined,
      clientName: resolvedName,
      clientPhone: resolvedPhone,
      clientEmail: resolvedEmail,
      location: location?.trim() || 'India',
      designStyle: selectedStyle,
      packageSelected: selectedPkg,
      bhkType: bhkType?.trim() || '3 BHK',
      propertySize: bhkType?.trim() || '',
      budgetRange: budgetRange?.trim() || (foundPkg ? foundPkg.price : '₹5.0 Lakhs'),
      consultationDate: consultationDate?.trim() || 'Immediate / Flexible',
      scope: Array.isArray(scope) ? scope : ['Free 3D Design', 'Material Selection'],
      quotation,
      quotationSubtext,
      status: 'In Progress',
      timeline: getDefaultMilestones('Interior'),
      source,
      notes: notes?.trim() || `Interior design inquiry for ${selectedStyle} style (${selectedPkg} package)`,
      notesHistory: [
        {
          text: `Inquiry submitted for ${selectedStyle} interiors via ${source.toUpperCase()}.`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: resolvedName,
          createdAt: new Date(),
        },
      ],
    });

    // Notify Admin
    await notifyAdmin({
      title: `New Interior Design Enquiry (${serviceRequestId})`,
      message: `${resolvedName} requested interior consultation for ${selectedStyle} style (${selectedPkg} Package). Contact: ${resolvedPhone}`,
      type: 'enquiry',
      metadata: {
        serviceRequestId: service._id,
        serviceRequestIdCode: serviceRequestId,
        serviceType: 'Interior',
        clientDetails: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
        customLink: '/admin/services',
      },
      senderId: req.user?._id || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Interior design consultation booked successfully. Our interior expert will connect with you shortly.',
      data: {
        serviceRequestId: service.serviceRequestId,
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unified Service Enquiry (Flexible endpoint for any service type)
// @route   POST /api/services/enquiry
// @access  Public (Optional User Auth)
exports.createUnifiedEnquiry = async (req, res, next) => {
  try {
    const { serviceType = 'Movers' } = req.body;
    const normalizedType = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).toLowerCase();

    if (normalizedType === 'Movers') {
      return exports.createMoversEnquiry(req, res, next);
    } else if (normalizedType === 'Legal') {
      return exports.createLegalEnquiry(req, res, next);
    } else if (normalizedType === 'Interior') {
      return exports.createInteriorEnquiry(req, res, next);
    }

    // Default general / loan fallback
    const {
      clientName,
      clientPhone,
      clientEmail,
      serviceName,
      location,
      loanRequired,
      employmentType,
      monthlyIncome,
      budgetRange,
      notes,
    } = req.body;

    const resolvedName = (clientName || req.user?.name || '').trim();
    const resolvedPhone = (clientPhone || req.user?.phone || '').trim();
    const resolvedEmail = (clientEmail || req.user?.email || '').trim().toLowerCase();

    if (!resolvedName || !resolvedPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client name and phone number are required.',
      });
    }

    const serviceRequestId = generateServiceId('Loan');
    const source = resolveSource(req);

    const service = await ServiceRequest.create({
      serviceRequestId,
      serviceType: 'Loan',
      serviceName: serviceName?.trim() || 'Home Loan Assistance',
      client: req.user?._id || undefined,
      clientName: resolvedName,
      clientPhone: resolvedPhone,
      clientEmail: resolvedEmail,
      location: location?.trim() || 'India',
      loanRequired: loanRequired?.trim() || '',
      employmentType: employmentType?.trim() || '',
      monthlyIncome: monthlyIncome?.trim() || '',
      budgetRange: budgetRange?.trim() || '',
      status: 'In Progress',
      timeline: getDefaultMilestones('Loan'),
      source,
      notes: notes?.trim() || 'Financial / Loan consultation request',
    });

    await notifyAdmin({
      title: `New Home Loan Enquiry (${serviceRequestId})`,
      message: `${resolvedName} requested loan assistance. Contact: ${resolvedPhone}`,
      type: 'enquiry',
      metadata: {
        serviceRequestId: service._id,
        serviceRequestIdCode: serviceRequestId,
        serviceType: 'Loan',
        clientDetails: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
        customLink: '/admin/services',
      },
      senderId: req.user?._id || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Service inquiry submitted successfully.',
      data: {
        serviceRequestId: service.serviceRequestId,
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's personal service enquiries
// @route   GET /api/services/my-enquiries
// @access  Private (User Auth)
exports.getMyEnquiries = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { client: req.user._id },
        { clientPhone: req.user.phone },
      ],
    };

    if (req.user.email) {
      filter.$or.push({ clientEmail: req.user.email.toLowerCase() });
    }

    const { serviceType } = req.query;
    if (serviceType && serviceType !== 'ALL') {
      filter.serviceType = serviceType;
    }

    const services = await ServiceRequest.find(filter)
      .populate('property', 'title price locality city images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track single service enquiry by ID or code
// @route   GET /api/services/track/:id
// @access  Public
exports.trackServiceEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await ServiceRequest.findById(id).select(
        'serviceRequestId serviceType serviceName location quotation quotationSubtext status timeline assignedPartner createdAt'
      );
    } else {
      service = await ServiceRequest.findOne({ serviceRequestId: id.toUpperCase().trim() }).select(
        'serviceRequestId serviceType serviceName location quotation quotationSubtext status timeline assignedPartner createdAt'
      );
    }

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service inquiry found with that reference number.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};
