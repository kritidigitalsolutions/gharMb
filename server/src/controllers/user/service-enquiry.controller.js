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
// @desc    Home Loan Enquiry & Quick Eligibility Check
// @route   POST /api/services/loan/enquiry (and /api/home-loan/enquiry)
// @access  Public (Optional User Auth)
exports.createHomeLoanEnquiry = async (req, res, next) => {
  try {
    const {
      clientName,
      name,
      fullName,
      clientPhone,
      phone,
      mobile,
      clientEmail,
      email,
      serviceName,
      location,
      city,
      propertyId,
      property,
      propertyRef,
      propertyName,
      propertyValue,
      estimatedPropertyValue,
      propertyPrice,
      monthlyIncome,
      monthlyNetIncome,
      income,
      existingEmis,
      existingMonthlyEmis,
      existingEmi,
      currentEmis,
      loanRequired,
      loanAmount,
      requestedAmount,
      loanTenure,
      tenure,
      tenureYears,
      interestRate,
      employmentType,
      cibilScore,
      creditScore,
      preferredBank,
      bank,
      budgetRange,
      notes,
      message,
    } = req.body;

    const resolvedName = (clientName || name || fullName || req.user?.name || 'Loan Applicant').trim();
    const resolvedPhone = (clientPhone || phone || mobile || req.user?.phone || '').trim();
    const resolvedEmail = (clientEmail || email || req.user?.email || '').trim().toLowerCase();
    const resolvedLocation = (location || city || req.user?.city || 'India').trim();

    if (!resolvedPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client contact mobile number is required for home loan enquiry.',
      });
    }

    if (!resolvedName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client full name is required for home loan enquiry.',
      });
    }

    // Helper to safely parse currency and numbers
    const parseAmount = (val) => {
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const incomeNum = parseAmount(monthlyIncome || monthlyNetIncome || income);
    const propValNum = parseAmount(propertyValue || estimatedPropertyValue || propertyPrice);
    const existingEmiNum = parseAmount(existingEmis || existingMonthlyEmis || existingEmi || currentEmis);
    let tenureNum = parseAmount(loanTenure || tenure || tenureYears) || 20;
    if (tenureNum > 30) tenureNum = 30; // max 30 years
    if (tenureNum < 1) tenureNum = 20;

    const rateNum = parseAmount(interestRate) || 8.5; // standard 8.5% p.a.
    const monthlyRate = rateNum / (12 * 100);
    const totalMonths = tenureNum * 12;

    // Standard Banking FOIR (Fixed Obligation to Income Ratio):
    // Income <= ₹50,000 -> 50% max EMI; > ₹50,000 -> 60% max EMI
    const foirRatio = incomeNum > 50000 ? 0.60 : 0.50;
    const maxPermissibleEmi = Math.max(0, (incomeNum * foirRatio) - existingEmiNum);

    // Loan eligibility: P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    let maxEligibleLoan = 0;
    if (maxPermissibleEmi > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      maxEligibleLoan = Math.round(maxPermissibleEmi * ((factor - 1) / (monthlyRate * factor)));
    }

    // LTV (Loan to Value) cap according to RBI guidelines:
    // <= ₹30L: up to 90%, ₹30L-₹75L: up to 80%, > ₹75L: up to 75%
    if (propValNum > 0) {
      let ltvCap = 0.80;
      if (propValNum <= 3000000) ltvCap = 0.90;
      else if (propValNum > 7500000) ltvCap = 0.75;
      const ltvMax = Math.round(propValNum * ltvCap);
      if (maxEligibleLoan > 0) {
        maxEligibleLoan = Math.min(maxEligibleLoan, ltvMax);
      } else {
        maxEligibleLoan = ltvMax;
      }
    }

    // Estimated EMI for requested loan or max eligible loan
    const reqLoanNum = parseAmount(loanRequired || loanAmount || requestedAmount);
    const loanBaseForEmi = reqLoanNum > 0 ? reqLoanNum : maxEligibleLoan;
    let calculatedEmi = 0;
    if (loanBaseForEmi > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      calculatedEmi = Math.round((loanBaseForEmi * monthlyRate * factor) / (factor - 1));
    }

    const formattedEligibility = maxEligibleLoan > 0 ? `₹${maxEligibleLoan.toLocaleString('en-IN')}` : 'Under Assessment';
    const formattedEmi = calculatedEmi > 0 ? `₹${calculatedEmi.toLocaleString('en-IN')}/month` : 'Contact for Quote';

    const serviceRequestId = generateServiceId('Loan');
    const source = resolveSource(req);

    const targetPropId = propertyId || property;
    const resolvedPropRef = propertyRef?.trim() || propertyName?.trim() || '';

    const service = await ServiceRequest.create({
      serviceRequestId,
      serviceType: 'Loan',
      serviceName: serviceName?.trim() || 'Home Loan Assistance',
      client: req.user?._id || undefined,
      clientName: resolvedName,
      clientPhone: resolvedPhone,
      clientEmail: resolvedEmail,
      location: resolvedLocation,
      property: targetPropId && targetPropId.match(/^[0-9a-fA-F]{24}$/) ? targetPropId : undefined,
      propertyRef: resolvedPropRef,
      propertyValue: propValNum > 0 ? `₹${propValNum.toLocaleString('en-IN')}` : (propertyValue?.trim() || ''),
      monthlyIncome: incomeNum > 0 ? `₹${incomeNum.toLocaleString('en-IN')}` : (monthlyIncome?.trim() || ''),
      existingEmis: existingEmiNum > 0 ? `₹${existingEmiNum.toLocaleString('en-IN')}` : (existingEmis?.trim() || '₹0'),
      loanRequired: reqLoanNum > 0 ? `₹${reqLoanNum.toLocaleString('en-IN')}` : (loanRequired?.trim() || ''),
      loanTenure: `${tenureNum} Years`,
      interestRate: `${rateNum}%`,
      calculatedEligibility: formattedEligibility,
      estimatedEmi: formattedEmi,
      employmentType: employmentType?.trim() || 'Salaried',
      cibilScore: (cibilScore || creditScore)?.trim() || '',
      preferredBank: (preferredBank || bank)?.trim() || '',
      budgetRange: budgetRange?.trim() || (propValNum > 0 ? `₹${propValNum.toLocaleString('en-IN')}` : ''),
      status: 'In Progress',
      timeline: getDefaultMilestones('Loan'),
      source,
      notes: notes?.trim() || message?.trim() || `Home Loan Eligibility Check: Monthly Income ₹${incomeNum.toLocaleString('en-IN')}, Property ₹${propValNum.toLocaleString('en-IN')}, Existing EMIs ₹${existingEmiNum.toLocaleString('en-IN')}. Estimated Eligibility: ${formattedEligibility}`,
    });

    // Notify Admin Panel with in-app alert & FCM push notification
    await notifyAdmin({
      title: `New Home Loan Enquiry (${serviceRequestId})`,
      message: `${resolvedName} submitted Home Loan Eligibility Enquiry. Monthly Income: ₹${incomeNum.toLocaleString('en-IN')}, Property: ₹${propValNum.toLocaleString('en-IN')}, Contact: ${resolvedPhone}`,
      type: 'enquiry',
      metadata: {
        serviceRequestId: service._id,
        serviceRequestIdCode: serviceRequestId,
        serviceType: 'Loan',
        monthlyIncome: service.monthlyIncome,
        propertyValue: service.propertyValue,
        existingEmis: service.existingEmis,
        calculatedEligibility: service.calculatedEligibility,
        estimatedEmi: service.estimatedEmi,
        loanRequired: service.loanRequired,
        employmentType: service.employmentType,
        clientDetails: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
        customLink: '/admin/enquiries?tab=service',
      },
      senderId: req.user?._id || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Home loan inquiry submitted successfully. Our finance specialist will contact you shortly.',
      data: {
        serviceRequestId: service.serviceRequestId,
        serviceId: service._id,
        eligibilityCheck: {
          monthlyIncome: service.monthlyIncome,
          propertyValue: service.propertyValue,
          existingEmis: service.existingEmis,
          maxEligibleLoan: formattedEligibility,
          estimatedMonthlyEmi: formattedEmi,
          tenureYears: tenureNum,
          assumedInterestRate: `${rateNum}%`,
        },
        service,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate Home Loan Eligibility & EMI in real time
// @route   POST /api/services/loan/calculate-eligibility
// @route   GET /api/services/loan/calculate-eligibility
// @access  Public
exports.calculateHomeLoanEligibility = async (req, res, next) => {
  try {
    const params = req.method === 'GET' ? req.query : req.body;
    const {
      monthlyIncome,
      monthlyNetIncome,
      income,
      propertyValue,
      estimatedPropertyValue,
      propertyPrice,
      existingEmis,
      existingMonthlyEmis,
      existingEmi,
      currentEmis,
      loanRequired,
      loanAmount,
      requestedAmount,
      loanTenure,
      tenure,
      tenureYears,
      interestRate,
      employmentType,
    } = params;

    const parseAmount = (val) => {
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const incomeNum = parseAmount(monthlyIncome || monthlyNetIncome || income);
    const propValNum = parseAmount(propertyValue || estimatedPropertyValue || propertyPrice);
    const existingEmiNum = parseAmount(existingEmis || existingMonthlyEmis || existingEmi || currentEmis);
    let tenureNum = parseAmount(loanTenure || tenure || tenureYears) || 20;
    if (tenureNum > 30) tenureNum = 30;
    if (tenureNum < 1) tenureNum = 20;

    const rateNum = parseAmount(interestRate) || 8.5;
    const monthlyRate = rateNum / (12 * 100);
    const totalMonths = tenureNum * 12;

    const foirRatio = incomeNum > 50000 ? 0.60 : 0.50;
    const maxPermissibleEmi = Math.max(0, (incomeNum * foirRatio) - existingEmiNum);

    let maxLoanByEmi = 0;
    if (maxPermissibleEmi > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      maxLoanByEmi = Math.round(maxPermissibleEmi * ((factor - 1) / (monthlyRate * factor)));
    }

    let ltvCap = 0.80;
    let ltvMax = 0;
    if (propValNum > 0) {
      if (propValNum <= 3000000) ltvCap = 0.90;
      else if (propValNum > 7500000) ltvCap = 0.75;
      ltvMax = Math.round(propValNum * ltvCap);
    }

    let maxEligibleLoan = maxLoanByEmi;
    if (ltvMax > 0 && maxEligibleLoan > 0) {
      maxEligibleLoan = Math.min(maxLoanByEmi, ltvMax);
    } else if (ltvMax > 0 && maxEligibleLoan === 0) {
      maxEligibleLoan = ltvMax;
    }

    const reqLoanNum = parseAmount(loanRequired || loanAmount || requestedAmount);
    const loanBaseForEmi = reqLoanNum > 0 ? reqLoanNum : maxEligibleLoan;
    let calculatedEmi = 0;
    if (loanBaseForEmi > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      calculatedEmi = Math.round((loanBaseForEmi * monthlyRate * factor) / (factor - 1));
    }

    let eligibilityStatus = 'Eligible';
    if (incomeNum === 0 && propValNum === 0) {
      eligibilityStatus = 'Enter Details';
    } else if (maxPermissibleEmi <= 0) {
      eligibilityStatus = 'High Existing EMIs';
    } else if (maxEligibleLoan > 0) {
      eligibilityStatus = 'Eligible';
    }

    return res.status(200).json({
      status: 'success',
      data: {
        inputs: {
          monthlyIncome: incomeNum,
          propertyValue: propValNum,
          existingEmis: existingEmiNum,
          tenureYears: tenureNum,
          interestRate: rateNum,
          requestedLoan: reqLoanNum > 0 ? reqLoanNum : undefined,
          employmentType: employmentType || 'Salaried',
        },
        eligibility: {
          maxEligibleLoanAmount: maxEligibleLoan,
          maxEligibleLoanFormatted: maxEligibleLoan > 0 ? `₹${maxEligibleLoan.toLocaleString('en-IN')}` : '₹0',
          maxPermissibleEmi: Math.round(maxPermissibleEmi),
          maxPermissibleEmiFormatted: `₹${Math.round(maxPermissibleEmi).toLocaleString('en-IN')}/month`,
          estimatedMonthlyEmi: calculatedEmi,
          estimatedMonthlyEmiFormatted: calculatedEmi > 0 ? `₹${calculatedEmi.toLocaleString('en-IN')}/month` : '₹0',
          tenureMonths: totalMonths,
          tenureYears: tenureNum,
          assumedInterestRate: `${rateNum}%`,
          foirRatioPercentage: Math.round(foirRatio * 100),
          ltvPercentage: Math.round(ltvCap * 100),
          eligibilityStatus,
        },
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
    } else if (normalizedType === 'Loan' || normalizedType === 'Homeloan' || normalizedType === 'Home-loan') {
      return exports.createHomeLoanEnquiry(req, res, next);
    }

    // Default general loan enquiry fallback
    return exports.createHomeLoanEnquiry(req, res, next);
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
