/**
 * App Property Listing Controller
 * Provides 5-step listing submission, editing, dashboard stats, and public search filters.
 */

const Property = require('../../models/property.model');
const User = require('../../models/user.model');
const Favorite = require('../../models/favorite.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');
const TokenRequest = require('../../models/token-request.model');
const { checkPropertyOwnership } = require('../../utils/ownershipCheck.helper');

// Helper to format prices into standard Indian real estate notation (Lac / Cr)
const formatIndianPrice = (price, listingFor) => {
  if (price === undefined || price === null || isNaN(price)) return 'Price on Request';
  const num = Number(price);
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (num >= 100000) {
    const lac = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lac} Lac`;
  }
  const formatted = num.toLocaleString('en-IN');
  return listingFor === 'Rent' || listingFor === 'Lease' ? `₹${formatted}/mo` : `₹${formatted}`;
};

/**
 * Normalizes possession date to Month & Year only (e.g. "June 2028", "Dec 2026")
 * or standard milestone terms like "Ready to Move", "Immediate".
 * Prevents calendar day numbers (e.g., converts "30 June 2028" or "2028-06-30" -> "June 2028").
 */
const normalizePossessionDate = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  // Standard milestone terms
  if (/^(ready\s*to\s*move|immediate|under\s*construction)$/i.test(trimmed)) {
    return trimmed;
  }

  // Matches YYYY-MM from month pickers
  const yyyyMmMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMmMatch) {
    const year = parseInt(yyyyMmMatch[1], 10);
    const month = parseInt(yyyyMmMatch[2], 10);
    const d = new Date(year, month - 1, 1);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  // Matches dates with days like "30 June 2028", "June 30, 2028", "2028-06-30", "30-06-2028"
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2200) {
    const hasSpecificDay = /\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b|\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b/.test(trimmed);
    if (hasSpecificDay) {
      return parsed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  return trimmed;
};

const {
  CITY_COORDINATES,
  calculateDistanceInKm,
  formatDistanceText,
  resolveCoordinates,
  resolveCoordinatesAsync,
} = require('../../utils/geocoder.helper');

// Helper to normalize and auto-calculate installment options details
const normalizeInstallmentData = (body = {}, totalPrice = 0) => {
  const allowInstallments = body.allowInstallments === true || body.allowInstallments === 'true';
  let installmentDetails = body.installmentDetails;

  if (typeof installmentDetails === 'string') {
    try {
      installmentDetails = JSON.parse(installmentDetails);
    } catch {
      installmentDetails = {};
    }
  }

  if (allowInstallments) {
    installmentDetails = installmentDetails || {};
    const price = Number(totalPrice) || Number(body.price) || 0;
    let downPaymentAmount = Number(installmentDetails.downPaymentAmount) || 0;
    let downPaymentPercentage = Number(installmentDetails.downPaymentPercentage) || 0;

    if (downPaymentPercentage > 0 && (!downPaymentAmount || downPaymentAmount === 0) && price > 0) {
      downPaymentAmount = Math.round((price * downPaymentPercentage) / 100);
    } else if (downPaymentAmount > 0 && price > 0 && (!downPaymentPercentage || downPaymentPercentage === 0)) {
      downPaymentPercentage = Math.round((downPaymentAmount / price) * 100);
    }

    const numberOfInstallments = Number(installmentDetails.numberOfInstallments) || 0;
    let installmentAmount = Number(installmentDetails.installmentAmount) || 0;

    // Auto-calculate installment amount if not provided but installments count is provided
    if ((!installmentAmount || installmentAmount === 0) && numberOfInstallments > 0 && price > 0) {
      const remainingBalance = Math.max(0, price - downPaymentAmount);
      installmentAmount = Math.round(remainingBalance / numberOfInstallments);
    }

    const freq = installmentDetails.installmentFrequency || 'Monthly';
    const durationMonths = Number(installmentDetails.installmentDurationMonths) || (
      freq === 'Quarterly' ? numberOfInstallments * 3 :
      freq === 'Bi-annual' ? numberOfInstallments * 6 :
      freq === 'Yearly' ? numberOfInstallments * 12 :
      numberOfInstallments
    );

    return {
      allowInstallments: true,
      installmentDetails: {
        downPaymentAmount,
        downPaymentPercentage,
        numberOfInstallments,
        installmentFrequency: freq,
        installmentAmount,
        interestRate: Number(installmentDetails.interestRate) || 0,
        installmentDurationMonths: durationMonths,
        gracePeriodDays: Number(installmentDetails.gracePeriodDays) || 0,
        termsAndConditions: (installmentDetails.termsAndConditions || '').trim(),
        milestones: Array.isArray(installmentDetails.milestones) ? installmentDetails.milestones : [],
      },
    };
  }

  return {
    allowInstallments: false,
    installmentDetails: {
      downPaymentAmount: 0,
      downPaymentPercentage: 0,
      numberOfInstallments: 0,
      installmentFrequency: 'Monthly',
      installmentAmount: 0,
      interestRate: 0,
      installmentDurationMonths: 0,
      gracePeriodDays: 0,
      termsAndConditions: '',
      milestones: [],
    },
  };
};

// Helper to enrich and standardize property objects with seller/owner role metadata (Builder, Agent, Owner)
const enrichPropertyWithSellerRole = (propertyDoc, fallbackOwner = null, userCoordinates = null) => {
  if (!propertyDoc) return propertyDoc;
  const obj = propertyDoc.toObject ? propertyDoc.toObject({ virtuals: true }) : { ...propertyDoc };
  const ownerObj = (obj.owner && typeof obj.owner === 'object') ? obj.owner : (fallbackOwner || {});
  const ownerRole = (ownerObj.role || 'owner').toLowerCase();
  const rawListing = (obj.listingAs || '').toLowerCase();
  const rawUserRole = (obj.userRole || '').toLowerCase();

  let effectiveRole = 'owner';
  let effectivePostedByRole = 'Owner';
  let effectiveListingAs = 'Owner';

  if (rawListing.includes('builder') || rawListing.includes('developer') || rawUserRole === 'builder' || ownerRole === 'builder') {
    effectiveRole = 'builder';
    effectivePostedByRole = 'Builder';
    effectiveListingAs = 'Developer / Builder';
  } else if (rawListing.includes('agent') || rawListing.includes('broker') || rawUserRole === 'agent' || ownerRole === 'agent') {
    effectiveRole = 'agent';
    effectivePostedByRole = 'Agent';
    effectiveListingAs = 'Agent / Broker';
  } else {
    effectiveRole = 'owner';
    effectivePostedByRole = 'Owner';
    effectiveListingAs = 'Owner';
  }

  const roleTitle =
    effectiveRole === 'builder'
      ? 'Builder Profile'
      : effectiveRole === 'agent'
      ? 'Agent Profile'
      : 'Owner Profile';

  const isOwnerVerified = Boolean(
    ownerObj.isVerified ||
    ownerObj.builderVerificationStatus === 'approved' ||
    ownerObj.agentVerificationStatus === 'approved'
  );

  const postedBy = {
    id: ownerObj._id || ownerObj.id || null,
    _id: ownerObj._id || ownerObj.id || null,
    name: ownerObj.name || '',
    phone: ownerObj.phone || '',
    email: ownerObj.email || '',
    role: effectiveRole,
    roleTitle,
    isVerified: isOwnerVerified,
    verificationBadge: isOwnerVerified ? 'Verified' : 'Unverified',
    companyName: ownerObj.companyName || '',
    reraNumber: ownerObj.reraNumber || '',
    profilePicture: ownerObj.profilePicture || '',
  };

  obj.id = obj._id;
  obj.listingAs = effectiveListingAs;
  obj.userRole = effectiveRole;
  obj.role = effectiveRole;
  obj.roleTitle = roleTitle;
  obj.postedByRole = effectivePostedByRole;
  obj.listedBy = effectivePostedByRole;
  obj.sellerRole = effectivePostedByRole;
  obj.ownerRole = effectiveRole;
  obj.companyName = ownerObj.companyName || '';
  obj.reraNumber = ownerObj.reraNumber || '';
  obj.postedBy = postedBy;
  if (!obj.owner || typeof obj.owner !== 'object') {
    obj.owner = postedBy;
  } else {
    obj.owner = {
      ...obj.owner,
      role: effectiveRole,
      roleTitle,
      isVerified: isOwnerVerified,
      verificationBadge: isOwnerVerified ? 'Verified' : 'Unverified',
      companyName: ownerObj.companyName || '',
      reraNumber: ownerObj.reraNumber || '',
    };
  }

  // Preserve and normalize rating fields
  obj.rating = Number(obj.rating) || 0;
  obj.reviewsCount = Number(obj.reviewsCount) || 0;
  obj.averageRating = Number(obj.rating) || 0;
  obj.totalRatings = Number(obj.reviewsCount) || 0;

  // Multiple BHK configurations metadata: ONLY BHK and its Price
  obj.bhkConfigurations = Array.isArray(obj.bhkConfigurations)
    ? obj.bhkConfigurations.map(b => ({
        bhk: b.bhk || b.bhkType || '',
        price: Number(b.price) || 0
      }))
    : [];
  obj.hasMultipleBhk = obj.bhkConfigurations.length > 0;
  if (obj.hasMultipleBhk) {
    const types = obj.bhkConfigurations
      .map((b) => b.bhk)
      .filter(Boolean);
    obj.bhkSummary = [...new Set(types)].join(', ');

    const prices = obj.bhkConfigurations
      .map((b) => Number(b.price || 0))
      .filter((p) => p > 0);
    if (prices.length > 1) {
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      obj.priceRangeText = `${formatIndianPrice(minP, obj.listingFor)} - ${formatIndianPrice(maxP, obj.listingFor)}`;
    } else if (prices.length === 1) {
      obj.priceRangeText = `${formatIndianPrice(prices[0], obj.listingFor)} onwards`;
    }
  } else {
    obj.bhkSummary = obj.bedrooms ? `${obj.bedrooms} BHK` : '';
    obj.priceRangeText = formatIndianPrice(obj.price, obj.listingFor);
  }

  // Multiple RERA registrations
  obj.reraNumbers = Array.isArray(obj.reraNumbers)
    ? obj.reraNumbers
        .map((r, idx) => {
          if (typeof r === 'string') {
            return { name: `Phase ${idx + 1}`, reraNumber: r.trim() };
          }
          return {
            name: String(r?.name || '').trim(),
            reraNumber: String(r?.reraNumber || '').trim(),
          };
        })
        .filter((r) => r.reraNumber)
    : (obj.reraNumber ? [{ name: 'Phase 1', reraNumber: String(obj.reraNumber).trim() }] : []);
  obj.reraNumber = obj.reraNumbers.length > 0 ? obj.reraNumbers[0].reraNumber : '';

  // Expected Possession Date (Month & Year only)
  obj.possessionDate = normalizePossessionDate(obj.possessionDate);

  // Sale status attributes
  obj.isSold = Boolean(obj.isSold);
  obj.saleStatus = obj.saleStatus || 'available';
  obj.isPendingSaleConfirmation = obj.saleStatus === 'marked_as_sold';

  // Security deposit for sale/resale properties is null/omitted
  const cleanListingForVal = String(obj.listingFor || '').trim().toLowerCase();
  if (['sale', 'resale'].includes(cleanListingForVal)) {
    obj.securityDeposit = null;
    obj.securityDepositDuration = null;
  }

  // Enrich with Admin Commission & Commission-Absorbed Discount fields for Mobile App / Frontend
  const pricingMeta = getDiscountAndPricingMetadata(obj);
  Object.assign(obj, pricingMeta);

  // Normalize and attach investmentScore for Mobile App feeds & details
  const invScore = (obj.investmentScore && typeof obj.investmentScore === 'object')
    ? (obj.investmentScore.toObject ? obj.investmentScore.toObject() : obj.investmentScore)
    : {};
  const rawMetrics = invScore.metrics || {};
  const connVal = Number(rawMetrics.connectivity ?? invScore.connectivity) || 0;
  const rentVal = Number(rawMetrics.rentalPotential ?? invScore.rentalPotential) || 0;
  const growVal = Number(rawMetrics.growthPotential ?? invScore.growthPotential) || 0;
  const famVal = Number(rawMetrics.familyLiving ?? invScore.familyLiving) || 0;
  const futVal = Number(rawMetrics.futureDemand ?? invScore.futureDemand) || 0;
  const overVal = Number(invScore.overall) || 0;
  const grdVal = invScore.grade || 'Not Rated';

  const normalizedMetrics = {
    connectivity: connVal,
    rentalPotential: rentVal,
    growthPotential: growVal,
    familyLiving: famVal,
    futureDemand: futVal,
  };

  obj.investmentScore = {
    overall: overVal,
    grade: grdVal,
    metrics: normalizedMetrics,
    connectivity: connVal,
    rentalPotential: rentVal,
    growthPotential: growVal,
    familyLiving: famVal,
    futureDemand: futVal,
  };

  // Mobile App root-level compatibility
  obj.connectivity = connVal;
  obj.rentalPotential = rentVal;
  obj.growthPotential = growVal;
  obj.familyLiving = famVal;
  obj.futureDemand = futVal;
  obj.investmentGrade = grdVal;
  obj.investmentRating = overVal;
  obj.metrics = normalizedMetrics;

  // 🛡️ Owner Restrictions: Owners cannot buy, rent, submit tokens, enquire, or review their own listings
  const callerUser = (fallbackOwner && fallbackOwner._id) ? fallbackOwner : null;
  const ownership = checkPropertyOwnership(obj, callerUser);
  const isOwner = Boolean(ownership.isOwner);
  obj.isOwner = isOwner;
  obj.canBuyOrRent = !isOwner;
  obj.canSubmitToken = !isOwner;
  obj.canSubmitEnquiry = !isOwner;
  obj.canSubmitReview = !isOwner;
  obj.canScheduleVisit = !isOwner;
  obj.ownerRestrictionMessage = isOwner
    ? (ownership.message || 'You are the registered owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or post reviews on their own properties.')
    : null;

  // ── 🛡️ MEDIA NORMALIZATION (Photos, Videos & Gallery) ─────────────────────
  const isVideoCheck = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      const cleanPath = decoded.split('?')[0];
      return (
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
        decoded.includes('/video/') ||
        decoded.includes('/videos/') ||
        decoded.includes('video/mp4') ||
        decoded.includes('format=mp4') ||
        decoded.includes('contenttype=video') ||
        decoded.includes('uploads%2fvideo') ||
        decoded.includes('uploads/video')
      );
    } catch (_) {
      return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
    }
  };

  const rawImages = Array.isArray(obj.images) ? obj.images : (Array.isArray(obj.photos) ? obj.photos : []);
  const rawVideos = Array.isArray(obj.videos) ? obj.videos : (Array.isArray(obj.propertyVideos) ? obj.propertyVideos : []);

  const pureImages = [];
  const pureVideos = [];

  for (const item of [...rawImages, ...rawVideos]) {
    if (typeof item !== 'string' || !item.trim()) continue;
    const trimmed = item.trim();
    if (isVideoCheck(trimmed)) {
      if (!pureVideos.includes(trimmed)) pureVideos.push(trimmed);
    } else {
      if (!pureImages.includes(trimmed)) pureImages.push(trimmed);
    }
  }

  obj.images = pureImages;
  obj.photos = pureImages;
  obj.videos = pureVideos;
  obj.propertyVideos = pureVideos;
  obj.video = pureVideos[0] || null;
  obj.videoUrl = pureVideos[0] || null;
  obj.hasVideo = pureVideos.length > 0;
  obj.videoCount = pureVideos.length;
  obj.thumbnail = pureImages[0] || '';
  obj.gallery = [
    ...pureImages.map((u) => ({ url: u, type: 'image' })),
    ...pureVideos.map((u) => ({ url: u, type: 'video' })),
  ];

  // ── 📍 Geolocation Distance Calculation ──────────────────────────────────
  const coords = obj.location?.coordinates;
  const propLng = Array.isArray(coords) ? Number(coords[0]) : null;
  const propLat = Array.isArray(coords) ? Number(coords[1]) : null;

  if (
    userCoordinates &&
    userCoordinates.lat !== undefined &&
    userCoordinates.lng !== undefined &&
    propLat !== null &&
    propLng !== null &&
    !isNaN(propLat) &&
    !isNaN(propLng)
  ) {
    const dist = calculateDistanceInKm(userCoordinates.lat, userCoordinates.lng, propLat, propLng);
    obj.distanceInKm = dist;
    obj.distanceInMeters = Math.round(dist * 1000);
    obj.distance = dist;
    obj.distanceText = formatDistanceText(dist);
  } else {
    obj.distanceInKm = null;
    obj.distanceInMeters = null;
    obj.distance = null;
    obj.distanceText = null;
  }

  // ── 🛡️ TRANSACTION NATURE & SELLER INTENT (Sale vs Resale vs Rent) ───────
  const cleanListing = String(obj.listingFor || '').trim().toLowerCase();
  const isRentListing = ['rent', 'lease', 'pg'].includes(cleanListing);
  const isResaleListing = cleanListing === 'resale' || (!isRentListing && effectiveRole !== 'builder');

  obj.isRent = isRentListing;
  obj.isResale = isResaleListing;
  obj.isSale = !isRentListing;
  obj.listingIntent = isRentListing ? 'Rent' : (isResaleListing ? 'Resale' : 'Sale');
  obj.displayListingFor = isRentListing ? 'Rent' : (isResaleListing ? 'Resale' : 'Sale');

  return obj;
};

// Helper to compute discount on admin commission and effective pricing breakdown
const getDiscountAndPricingMetadata = (obj = {}) => {
  const price = Number(obj.price) || 0;

  // DEVELOPER RULE: Default commission is 0% for builder listings UNLESS explicitly configured by admin
  const isDeveloperOrBuilder =
    obj.role === 'builder' ||
    obj.userRole === 'builder' ||
    obj.postedByRole === 'Builder' ||
    (obj.listingAs || '').toLowerCase().includes('builder') ||
    (obj.listingAs || '').toLowerCase().includes('developer');

  const hasCustomCommission =
    Boolean(obj.adminCommission && (Number(obj.adminCommission.rate) > 0 || Number(obj.adminCommission.amount) > 0)) ||
    Boolean(obj.commissionDiscount && obj.commissionDiscount.enabled);

  if (isDeveloperOrBuilder && !hasCustomCommission) {
    return {
      hasDiscount: false,
      discountAmount: 0,
      formattedDiscount: null,
      discountedPrice: price,
      formattedDiscountedPrice: formatIndianPrice(price, obj.listingFor),
      discountPercentage: 0,
      discountPercentageOnCommission: 0,
      discountLabel: null,
      discountNote: 'Developer / Builder listings carry 0% platform commission.',
      discountOnCommissionOnly: true,
      effectiveBuyerPrice: price,
      pricingSummary: {
        originalPrice: price,
        discountAmount: 0,
        effectivePrice: price,
        grossAdminCommission: 0,
        netAdminCommission: 0,
        sellerPayoutAmount: price,
        discountBorneBy: 'None',
        discountOnCommissionOnly: true,
      },
      adminCommission: {
        type: 'percentage',
        rate: 0,
        amount: 0,
      },
      commissionDiscount: {
        enabled: false,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        netCommission: 0,
        discountOnCommissionOnly: true,
        notes: 'Developer listings carry 0% platform commission.',
      },
    };
  }

  const adminComm = obj.adminCommission || {};
  const commDisc = obj.commissionDiscount || {};

  const commType = adminComm.type === 'fixed' ? 'fixed' : 'percentage';
  const commRate = commType === 'percentage' ? (Number(adminComm.rate) >= 0 ? Number(adminComm.rate) : 2) : 0;
  const grossCommission = commType === 'percentage'
    ? Math.round((price * commRate) / 100)
    : Math.round(Number(adminComm.amount || 0));

  const hasDiscount = Boolean(commDisc.enabled && (commDisc.discountAmount > 0 || commDisc.discountValue > 0));
  const discType = commDisc.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discVal = Number(commDisc.discountValue) || 0;

  let discAmount = 0;
  if (hasDiscount) {
    if (commDisc.discountAmount > 0) {
      discAmount = Number(commDisc.discountAmount);
    } else if (discType === 'percentage') {
      discAmount = Math.round((grossCommission * Math.min(100, Math.max(0, discVal))) / 100);
    } else {
      discAmount = Math.round(Math.min(grossCommission, Math.max(0, discVal)));
    }
  }

  const netCommission = Math.max(0, grossCommission - discAmount);
  const discountedPrice = Math.max(0, price - discAmount);
  const discountPctOnPrice = price > 0 ? Number(((discAmount / price) * 100).toFixed(2)) : 0;
  const discountPctOnComm = grossCommission > 0 ? Number(((discAmount / grossCommission) * 100).toFixed(1)) : 0;

  return {
    hasDiscount,
    discountAmount: discAmount,
    formattedDiscount: discAmount > 0 ? `₹${discAmount.toLocaleString('en-IN')}` : null,
    discountedPrice: discountedPrice,
    formattedDiscountedPrice: formatIndianPrice(discountedPrice, obj.listingFor),
    discountPercentage: discountPctOnPrice,
    discountPercentageOnCommission: discountPctOnComm,
    discountLabel: discAmount > 0 ? `₹${discAmount.toLocaleString('en-IN')} GharMB Discount` : null,
    discountNote: 'Discount is offered exclusively from GharMB Admin Commission. Property seller receives 100% of the listed price.',
    discountOnCommissionOnly: true,
    effectiveBuyerPrice: discountedPrice,
    pricingSummary: {
      originalPrice: price,
      discountAmount: discAmount,
      effectivePrice: discountedPrice,
      grossAdminCommission: grossCommission,
      netAdminCommission: netCommission,
      sellerPayoutAmount: price,
      discountBorneBy: 'Admin Commission',
      discountOnCommissionOnly: true,
    },
    adminCommission: {
      type: commType,
      rate: commRate,
      amount: grossCommission,
    },
    commissionDiscount: {
      enabled: hasDiscount,
      discountType: discType,
      discountValue: discVal,
      discountAmount: discAmount,
      netCommission: netCommission,
      discountOnCommissionOnly: true,
      notes: commDisc.notes || '',
    },
  };
};

// Unified helper to format property cards for dashboard tabs and list responses
const formatPropertyCard = (p, fallbackUser = null) => {
  const obj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
  const localityPart = obj.locality ? obj.locality.trim() : '';
  const cityPart = obj.city ? obj.city.trim() : '';
  const locationText = [localityPart, cityPart].filter(Boolean).join(', ');

  const ownerObj = (obj.owner && typeof obj.owner === 'object') ? obj.owner : (fallbackUser || {});
  const ownerRole = (ownerObj.role || 'owner').toLowerCase();
  const rawListing = (obj.listingAs || '').toLowerCase();
  const rawUserRole = (obj.userRole || '').toLowerCase();

  let effectiveRole = 'owner';
  let effectivePostedByRole = 'Owner';
  let effectiveListingAs = 'Owner';

  if (rawListing.includes('builder') || rawListing.includes('developer') || rawUserRole === 'builder' || ownerRole === 'builder') {
    effectiveRole = 'builder';
    effectivePostedByRole = 'Builder';
    effectiveListingAs = 'Developer / Builder';
  } else if (rawListing.includes('agent') || rawListing.includes('broker') || rawUserRole === 'agent' || ownerRole === 'agent') {
    effectiveRole = 'agent';
    effectivePostedByRole = 'Agent';
    effectiveListingAs = 'Agent / Broker';
  } else {
    effectiveRole = 'owner';
    effectivePostedByRole = 'Owner';
    effectiveListingAs = 'Owner';
  }

  const roleTitle =
    effectiveRole === 'builder'
      ? 'Builder Profile'
      : effectiveRole === 'agent'
      ? 'Agent Profile'
      : 'Owner Profile';

  const isOwnerVerified = Boolean(
    ownerObj.isVerified ||
    ownerObj.builderVerificationStatus === 'approved' ||
    ownerObj.agentVerificationStatus === 'approved'
  );

  const postedBy = {
    id: ownerObj._id || ownerObj.id || null,
    _id: ownerObj._id || ownerObj.id || null,
    name: ownerObj.name || '',
    phone: ownerObj.phone || '',
    email: ownerObj.email || '',
    role: effectiveRole,
    roleTitle,
    isVerified: isOwnerVerified,
    verificationBadge: isOwnerVerified ? 'Verified' : 'Unverified',
    companyName: ownerObj.companyName || '',
    reraNumber: ownerObj.reraNumber || '',
    profilePicture: ownerObj.profilePicture || '',
  };

  const isVideoCheck = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const decoded = decodeURIComponent(url).toLowerCase();
      const cleanPath = decoded.split('?')[0];
      return (
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
        decoded.includes('/video/') ||
        decoded.includes('/videos/') ||
        decoded.includes('video/mp4') ||
        decoded.includes('format=mp4') ||
        decoded.includes('contenttype=video') ||
        decoded.includes('uploads%2fvideo') ||
        decoded.includes('uploads/video')
      );
    } catch (_) {
      return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
    }
  };

  const rawImages = Array.isArray(obj.images) ? obj.images : (Array.isArray(obj.photos) ? obj.photos : []);
  const rawVideos = Array.isArray(obj.videos) ? obj.videos : (Array.isArray(obj.propertyVideos) ? obj.propertyVideos : []);

  const cardImages = [];
  const cardVideos = [];
  for (const item of [...rawImages, ...rawVideos]) {
    if (typeof item !== 'string' || !item.trim()) continue;
    const trimmed = item.trim();
    if (isVideoCheck(trimmed)) {
      if (!cardVideos.includes(trimmed)) cardVideos.push(trimmed);
    } else {
      if (!cardImages.includes(trimmed)) cardImages.push(trimmed);
    }
  }

  return {
    _id: obj._id,
    id: obj._id,
    submissionId: obj.submissionId || '',
    title: obj.title,
    locality: obj.locality || '',
    city: obj.city || '',
    location: locationText,
    fullAddress: obj.fullAddress || locationText,
    price: obj.price,
    formattedPrice: formatIndianPrice(obj.price, obj.listingFor),
    category: obj.category,
    propertyType: obj.propertyType,
    listingFor: obj.listingFor,
    bedrooms: obj.bedrooms,
    bathrooms: obj.bathrooms,
    carpetArea: obj.carpetArea,
    images: cardImages,
    photos: cardImages,
    videos: cardVideos,
    propertyVideos: cardVideos,
    video: cardVideos[0] || null,
    videoUrl: cardVideos[0] || null,
    hasVideo: cardVideos.length > 0,
    videoCount: cardVideos.length,
    thumbnail: cardImages[0] || '',
    gallery: [
      ...cardImages.map((u) => ({ url: u, type: 'image' })),
      ...cardVideos.map((u) => ({ url: u, type: 'video' })),
    ],
    approvalStatus: obj.approvalStatus,
    isLive: obj.isLive,
    rejectionReason: obj.rejectionReason || '',
    viewsCount: obj.viewsCount || 0,
    shortlistedCount: obj.shortlistedCount || 0,
    inquiriesCount: obj.inquiriesCount || 0,
    tokensCount: obj.tokensCount || 0,
    rating: Number(obj.rating) || 0,
    reviewsCount: Number(obj.reviewsCount) || 0,
    averageRating: Number(obj.rating) || 0,
    totalRatings: Number(obj.reviewsCount) || 0,
    createdAt: obj.createdAt,

    // Seller Role metadata on the card (Builder, Agent, Owner)
    listingAs: effectiveListingAs,
    userRole: effectiveRole,
    role: effectiveRole,
    roleTitle,
    postedByRole: effectivePostedByRole,
    listedBy: effectivePostedByRole,
    sellerRole: effectivePostedByRole,
    ownerRole: effectiveRole,
    companyName: ownerObj.companyName || '',
    reraNumber: ownerObj.reraNumber || '',
    postedBy,
    owner: postedBy,

    // Commission-Absorbed Discount and Effective Buyer Pricing
    ...getDiscountAndPricingMetadata(obj),

    // Admin-Curated Investment Score
    investmentScore: obj.investmentScore && obj.investmentScore.metrics ? obj.investmentScore : {
      overall: Number(obj.investmentScore?.overall) || 0,
      grade: obj.investmentScore?.grade || 'Not Rated',
      metrics: {
        connectivity: Number(obj.investmentScore?.metrics?.connectivity) || 0,
        rentalPotential: Number(obj.investmentScore?.metrics?.rentalPotential) || 0,
        growthPotential: Number(obj.investmentScore?.metrics?.growthPotential) || 0,
        familyLiving: Number(obj.investmentScore?.metrics?.familyLiving) || 0,
        futureDemand: Number(obj.investmentScore?.metrics?.futureDemand) || 0,
      },
    },

    // Distance fields
    distanceInKm: obj.distanceInKm ?? null,
    distanceInMeters: obj.distanceInMeters ?? null,
    distance: obj.distance ?? null,
    distanceText: obj.distanceText ?? null,

    // 🛡️ Owner Restrictions: Owners cannot buy, rent, submit tokens, enquire, or review their own listings
    isOwner: Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    canBuyOrRent: !Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    canSubmitToken: !Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    canSubmitEnquiry: !Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    canSubmitReview: !Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    canScheduleVisit: !Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner),
    ownerRestrictionMessage: Boolean(checkPropertyOwnership(obj, (fallbackUser && fallbackUser._id) ? fallbackUser : null).isOwner)
      ? 'You are the registered owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or post reviews on their own properties.'
      : null,
  };
};

// @desc    Retrieve approved live properties for search feed
// @route   GET /api/user/properties
// @access  Public
exports.getAllProperties = async (req, res, next) => {
  try {
    const {
      category,
      listingFor,
      propertyType,
      minPrice,
      maxPrice,
      city,
      locality,
      bedrooms,
      lat,
      lng,
      latitude,
      longitude,
      radius,
      distanceInKm,
      distance,
      maxDistance,
      keyHandover,
      vastuCompliant,
      openToAllBuyers,
      loanAssistanceNeeded,
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isLive: true,
    };

    // Filter available vs sold properties:
    // By default, clients see only available sites!
    // If includeSold=true or showSold=true, include sold properties.
    // If saleStatus is explicitly specified, filter by it.
    if (req.query.saleStatus) {
      query.saleStatus = req.query.saleStatus;
      if (req.query.saleStatus === 'sold') {
        query.isSold = true;
      }
    } else if (req.query.includeSold !== 'true' && req.query.showSold !== 'true') {
      query.isSold = { $ne: true };
      query.saleStatus = { $ne: 'sold' };
    }

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (listingFor) {
      const cleanLF = (listingFor || '').trim().toLowerCase();
      if (cleanLF === 'resale') {
        const builderUsers = await User.find({ role: 'builder' }).select('_id');
        const builderUserIds = builderUsers.map((u) => u._id);
        const nonBuilder = {
          postedByRole: { $nin: ['Builder', 'Developer'] },
          userRole: { $nin: ['builder', 'developer'] },
          listingAs: { $not: /builder|developer/i },
          owner: { $nin: builderUserIds },
        };
        if (!query.$and) query.$and = [];
        query.$and.push({
          $or: [
            { listingFor: new RegExp(`^resale$`, 'i') },
            { listingFor: new RegExp(`^sale$`, 'i'), ...nonBuilder },
          ],
        });
      } else if (cleanLF === 'sale' && !isNewProjects) {
        query.listingFor = new RegExp(`^(sale|resale)$`, 'i');
      } else {
        query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
      }
    }
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');
    if (city) query.city = new RegExp(city.trim(), 'i');
    if (locality) query.locality = new RegExp(locality.trim(), 'i');
    if (bedrooms) query.bedrooms = bedrooms;

    const search = req.query.search;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { city: searchRegex },
          { locality: searchRegex },
          { submissionId: searchRegex },
          { propertyType: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    // Buyer & Property Preferences filters
    if (keyHandover !== undefined) {
      query.keyHandover = keyHandover === 'true' || keyHandover === true;
    }
    if (vastuCompliant !== undefined) {
      query.vastuCompliant = vastuCompliant === 'true' || vastuCompliant === true;
    }
    if (openToAllBuyers !== undefined) {
      query.openToAllBuyers = openToAllBuyers === 'true' || openToAllBuyers === true;
    }
    if (loanAssistanceNeeded !== undefined) {
      query.loanAssistanceNeeded = loanAssistanceNeeded === 'true' || loanAssistanceNeeded === true;
    }
    // Installment / EMI available filter
    if (req.query.allowInstallments !== undefined) {
      query.allowInstallments = req.query.allowInstallments === 'true' || req.query.allowInstallments === true;
    }

    // Price range filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🛡️ NEW PROJECTS PAGE RULE: Display ONLY Developer/Builder properties
    const roleParam = (req.query.role || req.query.userRole || req.query.postedByRole || '').trim().toLowerCase();
    const listingAsParam = (req.query.listingAs || '').trim().toLowerCase();
    const isNewProjects =
      req.path?.includes('new-projects') ||
      req.originalUrl?.includes('new-projects') ||
      req.query.isNewProjects === 'true' ||
      req.query.newProjects === 'true' ||
      req.query.isProject === 'true' ||
      req.query.project === 'true' ||
      req.query.isDeveloper === 'true' ||
      req.query.developer === 'true' ||
      req.query.isBuilder === 'true' ||
      req.query.builder === 'true' ||
      roleParam === 'builder' ||
      roleParam === 'developer' ||
      listingAsParam.includes('builder') ||
      listingAsParam.includes('developer');

    if (isNewProjects) {
      // 🛡️ NEW PROJECTS RULE: Developer & Builder inventory must strictly be for Sale / Purchase
      // Exclude Rent, Lease, and PG listings from the new projects feed
      query.listingFor = 'Sale';

      // Fetch all users with role 'builder'
      const builderUsers = await User.find({ role: 'builder' }).select('_id');
      const builderUserIds = builderUsers.map((u) => u._id);

      const builderConditions = [
        { postedByRole: { $regex: /builder|developer/i } },
        { userRole: { $regex: /builder|developer/i } },
        { listingAs: { $regex: /builder|developer/i } },
      ];
      if (builderUserIds.length > 0) {
        builderConditions.push({ owner: { $in: builderUserIds } });
      }

      if (!query.$and) query.$and = [];
      query.$and.push({ $or: builderConditions });
    } else if (roleParam === 'agent' || listingAsParam.includes('agent') || listingAsParam.includes('broker')) {
      const agentUsers = await User.find({ role: 'agent' }).select('_id');
      const agentUserIds = agentUsers.map((u) => u._id);

      const agentConditions = [
        { postedByRole: { $regex: /agent|broker/i } },
        { userRole: { $regex: /agent|broker/i } },
        { listingAs: { $regex: /agent|broker/i } },
      ];
      if (agentUserIds.length > 0) {
        agentConditions.push({ owner: { $in: agentUserIds } });
      }

      if (!query.$and) query.$and = [];
      query.$and.push({ $or: agentConditions });
    } else if (roleParam === 'owner') {
      const nonOwnerUsers = await User.find({ role: { $in: ['builder', 'agent'] } }).select('_id');
      const nonOwnerUserIds = nonOwnerUsers.map((u) => u._id);

      const ownerConditions = [
        { postedByRole: { $nin: ['Builder', 'Agent'] } },
        { userRole: { $nin: ['builder', 'agent'] } },
        { listingAs: { $not: /builder|developer|agent|broker/i } },
      ];
      if (nonOwnerUserIds.length > 0) {
        ownerConditions.push({ owner: { $nin: nonOwnerUserIds } });
      }

      if (!query.$and) query.$and = [];
      query.$and.push({ $and: ownerConditions });
    }

    // ── Geospatial Proximity & Nearest-First Sorting ──────────────────────────
    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const parsedLat = parseFloat(targetLat);
    const parsedLng = parseFloat(targetLng);
    const hasCoordinates =
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180;

    const rawDist = distanceInKm || radius || distance || maxDistance;
    const maxDistKm = rawDist !== undefined && rawDist !== null && rawDist !== '' ? parseFloat(rawDist) : null;
    const hasMaxDistance = maxDistKm !== null && !isNaN(maxDistKm) && maxDistKm > 0;

    const countQuery = { ...query };

    if (hasCoordinates) {
      const geoNearQuery = {
        $geometry: {
          type: 'Point',
          coordinates: [parsedLng, parsedLat],
        },
      };

      if (hasMaxDistance) {
        geoNearQuery.$maxDistance = maxDistKm * 1000; // convert km to meters
        const radiusInRadians = maxDistKm / 6378.1;
        countQuery.location = {
          $geoWithin: {
            $centerSphere: [[parsedLng, parsedLat], radiusInRadians],
          },
        };
      }

      query.location = {
        $nearSphere: geoNearQuery,
      };
    }

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // When querying with $nearSphere, MongoDB naturally sorts from nearest to farthest.
    // Explicit sort() cannot be combined with $nearSphere in MongoDB.
    let propertyQuery = Property.find(query);
    if (!hasCoordinates) {
      propertyQuery = propertyQuery.sort({ createdAt: -1 });
    }

    const [properties, total] = await Promise.all([
      propertyQuery
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber'),
      Property.countDocuments(countQuery),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const userCoords = hasCoordinates ? { lat: parsedLat, lng: parsedLng } : null;
    const enrichedProperties = properties.map((p) => enrichPropertyWithSellerRole(p, req.user, userCoords));

    res.status(200).json({
      status: 'success',
      results: enrichedProperties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      userLocation: hasCoordinates ? { latitude: parsedLat, longitude: parsedLng } : null,
      isLocationSorted: hasCoordinates,
      data: {
        properties: enrichedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve detailed property listing (increments view count)
// @route   GET /api/user/properties/:id
// @access  Public
exports.getPropertyDetails = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone profilePicture isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber role address');

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
    }

    // Only block if property is offline and NOT sold out
    const isOwner = Boolean(checkPropertyOwnership(property, req.user, req.query).isOwner);
    const isPublicUser = !isOwner && !['admin', 'superadmin', 'super_admin'].includes((req.user?.role || '').toLowerCase());
    const isSoldOut = Boolean(property.isSold || property.saleStatus === 'sold');

    if (isPublicUser && !property.isLive && !isSoldOut) {
      return res.status(404).json({
        status: 'fail',
        message: 'This property is not currently active.',
      });
    }

    // Increment views only for approved live properties
    if (property.approvalStatus === 'approved' && property.isLive) {
      await Property.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    }

    const ownership = checkPropertyOwnership(property, req.user, req.query);

    const enrichedProperty = enrichPropertyWithSellerRole(property);
    enrichedProperty.isOwner = isOwner;
    enrichedProperty.isSold = isSoldOut;
    enrichedProperty.isSoldOut = isSoldOut;
    enrichedProperty.saleStatus = property.saleStatus || (isSoldOut ? 'sold' : 'available');
    enrichedProperty.canBuyOrRent = !isOwner && !isSoldOut;
    enrichedProperty.canSubmitToken = !isOwner && !isSoldOut;
    enrichedProperty.canSubmitEnquiry = !isOwner && !isSoldOut;
    enrichedProperty.canSubmitReview = !isOwner;
    enrichedProperty.canScheduleVisit = !isOwner && !isSoldOut;
    enrichedProperty.soldOutMessage = isSoldOut
      ? 'This property has been marked as Sold Out and is no longer available for booking or inquiries.'
      : null;
    enrichedProperty.ownerRestrictionMessage = isOwner
      ? 'You are the registered owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or post reviews on their own properties.'
      : null;

    // Fetch rating breakdown and recent reviews for this property
    let recentReviews = [];
    let breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    try {
      const PropertyReview = require('../../models/property-review.model');
      const [revs, breakdownAgg] = await Promise.all([
        PropertyReview.find({ property: property._id })
          .populate('reviewer', 'name profilePicture phone role')
          .sort({ createdAt: -1 })
          .limit(10),
        PropertyReview.aggregate([
          { $match: { property: property._id } },
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);
      recentReviews = revs;
      breakdownAgg.forEach((item) => {
        const star = Math.round(item._id);
        if (breakdown[star] !== undefined) breakdown[star] = item.count;
      });
    } catch (revErr) {
      console.error('Error fetching property reviews in getPropertyDetails:', revErr.message);
    }

    enrichedProperty.rating = Number(property.rating) || 0;
    enrichedProperty.reviewsCount = Number(property.reviewsCount) || 0;
    enrichedProperty.averageRating = Number(property.rating) || 0;
    enrichedProperty.totalRatings = Number(property.reviewsCount) || 0;
    enrichedProperty.ratings = {
      averageRating: Number(property.rating) || 0,
      totalReviews: Number(property.reviewsCount) || 0,
      breakdown,
      recentReviews,
    };

    const propInv = (property.investmentScore && typeof property.investmentScore === 'object')
      ? (property.investmentScore.toObject ? property.investmentScore.toObject() : property.investmentScore)
      : {};
    const propMetrics = propInv.metrics || {};
    const cVal = Number(propMetrics.connectivity ?? propInv.connectivity) || 0;
    const rVal = Number(propMetrics.rentalPotential ?? propInv.rentalPotential) || 0;
    const gVal = Number(propMetrics.growthPotential ?? propInv.growthPotential) || 0;
    const lVal = Number(propMetrics.familyLiving ?? propInv.familyLiving) || 0;
    const dVal = Number(propMetrics.futureDemand ?? propInv.futureDemand) || 0;
    const oVal = Number(propInv.overall) || 0;
    const grVal = propInv.grade || 'Not Rated';

    const cleanMetrics = {
      connectivity: cVal,
      rentalPotential: rVal,
      growthPotential: gVal,
      familyLiving: lVal,
      futureDemand: dVal,
    };

    enrichedProperty.investmentScore = {
      overall: oVal,
      grade: grVal,
      metrics: cleanMetrics,
      connectivity: cVal,
      rentalPotential: rVal,
      growthPotential: gVal,
      familyLiving: lVal,
      futureDemand: dVal,
    };

    // Root-level metrics for mobile app compatibility
    enrichedProperty.connectivity = cVal;
    enrichedProperty.rentalPotential = rVal;
    enrichedProperty.growthPotential = gVal;
    enrichedProperty.familyLiving = lVal;
    enrichedProperty.futureDemand = dVal;
    enrichedProperty.investmentGrade = grVal;
    enrichedProperty.investmentRating = oVal;
    enrichedProperty.metrics = cleanMetrics;

    res.status(200).json({
      status: 'success',
      data: {
        property: enrichedProperty,
        isOwner,
        canBuyOrRent: !isOwner,
        canSubmitToken: !isOwner,
        canSubmitEnquiry: !isOwner,
        canSubmitReview: !isOwner,
        canScheduleVisit: !isOwner,
        ownerRestrictionMessage: isOwner
          ? 'You are the registered owner of this property listing. Owners cannot buy, rent, book tokens, send enquiries, or post reviews on their own properties.'
          : null,
        ratings: {
          averageRating: Number(property.rating) || 0,
          totalReviews: Number(property.reviewsCount) || 0,
          breakdown,
          recentReviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new 5-Step property listing for Admin review
// @route   POST /api/user/properties
// @access  Private (Owner/Agent/Builder)
exports.createProperty = async (req, res, next) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toLowerCase().trim();
    const rawListingAs = (req.body.listingAs || req.body.role || '').toLowerCase().trim();

    // ── 🛡️ ROLE-BASED PROPERTY LISTING ENFORCEMENT ────────────────────────────
    // Initially, users have three options: Property Owner, Agent, and Developer.
    // If a user selects Property Owner, they can list properties ONLY as an owner.
    // The same restriction applies to Agent and Developer roles.
    // Users cannot list properties under other roles through the selected option.
    const isListingAsDeveloper = rawListingAs.includes('builder') || rawListingAs.includes('developer');
    const isListingAsAgent = rawListingAs.includes('agent') || rawListingAs.includes('broker');
    const isListingAsOwner = rawListingAs === 'owner' || rawListingAs === 'property owner' || (!isListingAsDeveloper && !isListingAsAgent);

    if (userRole === 'owner') {
      if (isListingAsAgent || isListingAsDeveloper) {
        return res.status(403).json({
          status: 'fail',
          message: 'Role Restriction: You are registered as a Property Owner and can only list properties under the Owner role. Listing as an Agent or Developer is not permitted.',
        });
      }
    } else if (userRole === 'agent') {
      if (isListingAsOwner || isListingAsDeveloper) {
        return res.status(403).json({
          status: 'fail',
          message: 'Role Restriction: You are registered as an Agent and can only list properties under the Agent role. Listing as a Property Owner or Developer is not permitted.',
        });
      }
    } else if (userRole === 'builder' || userRole === 'developer') {
      if (isListingAsOwner || isListingAsAgent) {
        return res.status(403).json({
          status: 'fail',
          message: 'Role Restriction: You are registered as a Developer and can only list properties under the Developer role. Listing as a Property Owner or Agent is not permitted.',
        });
      }
    } else {
      // First-time role selection: Bind user account to the selected role
      if (isListingAsDeveloper) {
        user.role = 'builder';
        await user.save();
      } else if (isListingAsAgent) {
        user.role = 'agent';
        await user.save();
      } else {
        user.role = 'owner';
        await user.save();
      }
    }

    // Determine normalized role and listingAs
    const effectiveRole =
      (user.role || '').toLowerCase() === 'builder' || (user.role || '').toLowerCase() === 'developer'
        ? 'builder'
        : (user.role || '').toLowerCase() === 'agent'
        ? 'agent'
        : 'owner';

    const normalizedListingAs =
      effectiveRole === 'builder' ? 'Developer / Builder' :
      effectiveRole === 'agent' ? 'Agent / Broker' : 'Owner';
    const normalizedUserRole = effectiveRole;
    const normalizedPostedByRole =
      effectiveRole === 'builder' ? 'Builder' :
      effectiveRole === 'agent' ? 'Agent' : 'Owner';

    // 1. Agent Verification Guard: Agent must be verified & approved by Admin before uploading
    if (normalizedUserRole === 'agent') {
      if (user.agentVerificationStatus !== 'approved') {
        if (user.agentVerificationStatus === 'rejected') {
          return res.status(403).json({
            status: 'fail',
            message: `Your Agent profile verification was rejected by admin: ${user.agentRejectionReason || 'Please review and re-upload your verification documents.'}`,
          });
        }
        return res.status(403).json({
          status: 'fail',
          message: 'Your Agent profile and RERA documents are currently under admin review. You can upload properties once admin verifies and approves your account.',
        });
      }
    }

    // 2. Developer / Builder Verification Guard: Developer must be verified & approved by Admin before uploading
    if (normalizedUserRole === 'builder') {
      if (user.builderVerificationStatus !== 'approved') {
        if (user.builderVerificationStatus === 'rejected') {
          return res.status(403).json({
            status: 'fail',
            message: `Your Developer profile verification was rejected by admin: ${user.builderRejectionReason || 'Please review and re-upload your company documents.'}`,
          });
        }
        return res.status(403).json({
          status: 'fail',
          message: 'Your Developer profile and company documents are currently under admin review. You can upload properties once admin verifies and approves your account.',
        });
      }
    }

    // 3. Prepare property data
    const installmentData = normalizeInstallmentData(req.body, req.body.price);

    const propertyData = {
      ...req.body,
      ...installmentData,
      listingAs: normalizedListingAs,
      userRole: normalizedUserRole,
      postedByRole: normalizedPostedByRole,
      owner: user._id,
      approvalStatus: 'pending',
      isLive: false,
      isSold: false,
      saleStatus: 'available',
      possessionDate: normalizePossessionDate(req.body.possessionDate),
    };

    // ── 🛡️ MEDIA EXTRACTION & SEPARATION (Images & Videos) ─────────────────────
    const isMediaVideo = (url) => {
      if (!url || typeof url !== 'string') return false;
      try {
        const decoded = decodeURIComponent(url).toLowerCase();
        const cleanPath = decoded.split('?')[0];
        return (
          /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
          decoded.includes('/video/') ||
          decoded.includes('/videos/') ||
          decoded.includes('video/mp4') ||
          decoded.includes('format=mp4') ||
          decoded.includes('contenttype=video') ||
          decoded.includes('uploads%2fvideo') ||
          decoded.includes('uploads/video')
        );
      } catch (_) {
        return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
      }
    };

    let rawMedia = [];
    if (Array.isArray(req.body.images)) rawMedia.push(...req.body.images);
    if (Array.isArray(req.body.photos)) rawMedia.push(...req.body.photos);
    if (Array.isArray(req.body.videos)) rawMedia.push(...req.body.videos);
    if (Array.isArray(req.body.propertyVideos)) rawMedia.push(...req.body.propertyVideos);
    if (typeof req.body.video === 'string' && req.body.video) rawMedia.push(req.body.video);
    if (typeof req.body.videoUrl === 'string' && req.body.videoUrl) rawMedia.push(req.body.videoUrl);

    const extractedImages = [];
    const extractedVideos = [];

    for (const item of rawMedia) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const trimmed = item.trim();
      if (isMediaVideo(trimmed)) {
        if (!extractedVideos.includes(trimmed)) extractedVideos.push(trimmed);
      } else {
        if (!extractedImages.includes(trimmed)) extractedImages.push(trimmed);
      }
    }

    if (extractedImages.length > 0 || extractedVideos.length > 0) {
      propertyData.images = extractedImages;
      propertyData.videos = extractedVideos;
      propertyData.propertyVideos = extractedVideos;
    }

    // ── 🛡️ SECURITY DEPOSIT & DURATION RULE ──────────────────────────────────
    // Remove Security Deposit and Security Duration fields for properties available for Sale or Resale
    const isForSale = ['sale', 'resale'].includes(String(propertyData.listingFor || '').trim().toLowerCase());
    if (isForSale) {
      delete propertyData.securityDeposit;
      delete propertyData.securityDepositDuration;
      propertyData.securityDeposit = undefined;
      propertyData.securityDepositDuration = undefined;
    }

    // ── 🛡️ MULTIPLE BHK OPTIONS FOR DEVELOPERS / BUILDERS ─────────────────────
    // Parse and handle multiple BHK configurations: ONLY BHK and its custom Price
    let bhkConfigs = req.body.bhkConfigurations;
    if (typeof bhkConfigs === 'string') {
      try {
        bhkConfigs = JSON.parse(bhkConfigs);
      } catch {
        bhkConfigs = [];
      }
    }
    if (Array.isArray(bhkConfigs) && bhkConfigs.length > 0) {
      propertyData.bhkConfigurations = bhkConfigs
        .map((item) => ({
          bhk: item.bhk || item.bhkType || '',
          bhkType: item.bhk || item.bhkType || '',
          price: Number(item.price) || 0,
        }))
        .filter((b) => b.bhk && b.price > 0);

      const validPrices = propertyData.bhkConfigurations
        .map((b) => Number(b.price || 0))
        .filter((p) => p > 0);
      if (validPrices.length > 0 && (!propertyData.price || Number(propertyData.price) === 0)) {
        propertyData.price = Math.min(...validPrices);
      }
      const firstBhk = propertyData.bhkConfigurations[0];
      if (!propertyData.bedrooms && firstBhk?.bhk) {
        propertyData.bedrooms = firstBhk.bhk;
      }
    }

    // ── 🛡️ MULTIPLE RERA NUMBERS FOR BUILDER / DEVELOPER LISTINGS ─────────────
    let rawRera = req.body.reraNumbers !== undefined ? req.body.reraNumbers : req.body.reraNumber;
    let parsedReraNumbers = [];
    if (typeof rawRera === 'string') {
      try {
        const parsed = JSON.parse(rawRera);
        if (Array.isArray(parsed)) parsedReraNumbers = parsed;
        else if (parsed && typeof parsed === 'object') parsedReraNumbers = [parsed];
        else if (parsed) parsedReraNumbers = [{ reraNumber: String(parsed) }];
      } catch {
        parsedReraNumbers = rawRera.includes(',')
          ? rawRera.split(',').map((r) => ({ reraNumber: r }))
          : [{ reraNumber: rawRera }];
      }
    } else if (Array.isArray(rawRera)) {
      parsedReraNumbers = rawRera;
    } else if (rawRera && typeof rawRera === 'object') {
      parsedReraNumbers = [rawRera];
    }

    parsedReraNumbers = parsedReraNumbers
      .map((item, idx) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed ? { name: `Phase ${idx + 1}`, reraNumber: trimmed } : null;
        }
        if (item && typeof item === 'object') {
          const num = String(item.reraNumber || item.number || item.id || '').trim();
          if (!num) return null;
          const nm = String(item.name || item.phase || item.phaseName || '').trim();
          return { name: nm, reraNumber: num };
        }
        return null;
      })
      .filter(Boolean);

    const seenRera = new Set();
    const uniqueReraNumbers = [];
    for (const r of parsedReraNumbers) {
      if (!seenRera.has(r.reraNumber)) {
        seenRera.add(r.reraNumber);
        uniqueReraNumbers.push(r);
      }
    }

    // MANDATORY RERA RULE FOR BUILDER / DEVELOPER (EXCEPT PLOT):
    const isPlot = String(req.body.propertyType || '').trim().toLowerCase().includes('plot');
    if (normalizedUserRole === 'builder' && !isPlot) {
      if (!uniqueReraNumbers || uniqueReraNumbers.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'At least one RERA registration number is mandatory for Developer/Builder project listings (except Plots).',
        });
      }
    }
    propertyData.reraNumbers = uniqueReraNumbers;

    // ── 🛡️ DEVELOPER COMMISSION RULE ─────────────────────────────────────────
    // Commission will not be included in property listings created by developers/builders
    if (normalizedUserRole === 'builder') {
      propertyData.adminCommission = {
        type: 'percentage',
        rate: 0,
        amount: 0,
      };
      propertyData.commissionDiscount = {
        enabled: false,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        netCommission: 0,
        discountOnCommissionOnly: true,
        notes: 'Developer / Builder listings carry 0% platform commission.',
      };
    }

    // Robust location coordinates handling (exact GPS or high-precision geocoded)
    const resolvedCoords = await resolveCoordinatesAsync(req.body);
    propertyData.location = {
      type: 'Point',
      coordinates: resolvedCoords,
    };

    const property = await Property.create(propertyData);

    // Notify all admins about the new property submission
    try {
      const Admin = require('../../models/admin.model');
      const Notification = require('../../models/notification.model');
      const admins = await Admin.find().select('_id');
      if (admins.length > 0) {
        const notificationsData = admins.map((admin) => ({
          recipient: admin._id,
          title: 'New Property Verification Pending',
          message: `A new property listing "${property.title}" (${property.category} - ${property.listingFor}) by ${user.name} requires verification.`,
          type: 'verification',
          metadata: {
            propertyId: property._id,
          },
          isRead: false,
        }));
        await Notification.insertMany(notificationsData);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for property creation:', notifErr);
    }

    // ── Refer & Earn Reward Trigger (When friend posts their first listing) ─
    try {
      const { processFirstListingReferralReward } = require('../../utils/referralCode.helper');
      await processFirstListingReferralReward(user._id, property._id, property.title);
    } catch (refRewardErr) {
      console.warn('⚠️ [Property Referral Reward Error]:', refRewardErr.message);
    }

    const enrichedProperty = enrichPropertyWithSellerRole(property, user);

    res.status(201).json({
      status: 'success',
      message: 'Property listing submitted successfully! Admin will verify and approve before it goes live.',
      data: {
        submissionId: property.submissionId,
        property: enrichedProperty,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve My Dashboard stats, listings tabs (Live, Pending, Rejected) & performance metrics
// @route   GET /api/user/properties/my-dashboard
// @access  Private
exports.getMyDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { tab = 'live', page = 1, limit = 10, period = 'all' } = req.query;

    // Fetch user details for freshest profile info
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      });
    }

    // Fetch all listings created by current user with populated owner
    const userProperties = await Property.find({ owner: ownerId })
      .populate('owner', 'name phone email role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber profilePicture address')
      .sort({ createdAt: -1 });

    const totalListings = userProperties.length;
    const liveListings = userProperties.filter((p) => p.approvalStatus === 'approved' && p.isLive);
    const pendingListings = userProperties.filter((p) => p.approvalStatus === 'pending');
    const rejectedListings = userProperties.filter((p) => p.approvalStatus === 'rejected');

    // Token requests metrics
    let pendingTokensCount = 0;
    let acceptedTokensCount = 0;
    let totalTokenAmount = 0;

    try {
      pendingTokensCount = await TokenRequest.countDocuments({ owner: ownerId, status: 'pending' });
      acceptedTokensCount = await TokenRequest.countDocuments({ owner: ownerId, status: 'accepted' });

      const tokenAmountAgg = await TokenRequest.aggregate([
        { $match: { owner: ownerId, status: 'accepted' } },
        { $group: { _id: null, total: { $sum: '$tokenAmount' } } },
      ]);
      if (tokenAmountAgg.length > 0) {
        totalTokenAmount = tokenAmountAgg[0].total || 0;
      }
    } catch (err) {
      console.error('Error fetching token request stats:', err.message);
    }

    // Fallback if no TokenRequest documents exist yet
    const propertyTokensSum = userProperties.reduce((acc, p) => acc + (p.tokensCount || 0), 0);
    const effectivePendingTokens = pendingTokensCount;
    const effectiveAcceptedTokens = acceptedTokensCount || (pendingTokensCount === 0 ? propertyTokensSum : 0);

    // Inquiries and Shortlisted counts across all properties (all-time, not this month)
    const userPropertyIds = userProperties.map((p) => p._id);
    let totalInquiries = 0;
    let totalShortlisted = 0;

    try {
      if (userPropertyIds.length > 0) {
        totalInquiries = await PropertyEnquiry.countDocuments({ property: { $in: userPropertyIds } });
        totalShortlisted = await Favorite.countDocuments({ property: { $in: userPropertyIds } });
      }
    } catch (err) {
      console.error('Error counting inquiries/shortlists:', err.message);
    }

    // Fallback to property counters if query returned 0
    if (totalInquiries === 0) {
      totalInquiries = userProperties.reduce((acc, p) => acc + (p.inquiriesCount || 0), 0);
    }
    if (totalShortlisted === 0) {
      totalShortlisted = userProperties.reduce((acc, p) => acc + (p.shortlistedCount || 0), 0);
    }

    // Total Views (all-time)
    const totalViews = userProperties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);

    // Profile formatting
    const roleTitleMap = {
      builder: 'Builder Profile',
      agent: 'Agent Profile',
      owner: 'Owner Profile',
      buyer: 'Buyer Profile',
      tenant: 'Tenant Profile',
    };
    const roleTitle =
      roleTitleMap[user.role] ||
      `${(user.role || 'User').charAt(0).toUpperCase()}${(user.role || 'User').slice(1)} Profile`;

    const isVerified = Boolean(
      user.isVerified ||
      user.builderVerificationStatus === 'approved' ||
      user.agentVerificationStatus === 'approved'
    );

    const verificationBadge = isVerified ? 'Verified' : 'Unverified';

    const formattedAddress =
      user.address?.formattedAddress ||
      [user.address?.street, user.address?.city, user.address?.state, user.address?.pincode]
        .filter(Boolean)
        .join(', ') ||
      (typeof user.address === 'string' ? user.address : '') ||
      '';

    // Format list for each tab using the unified card formatter with seller role info
    const formattedLive = liveListings.map((p) => formatPropertyCard(p, user));
    const formattedPending = pendingListings.map((p) => formatPropertyCard(p, user));
    const formattedRejected = rejectedListings.map((p) => formatPropertyCard(p, user));
    const formattedAll = userProperties.map((p) => formatPropertyCard(p, user));

    // Active tab selection & pagination
    const activeTab = (tab || 'live').toLowerCase();
    let currentList = formattedLive;
    if (activeTab === 'pending') currentList = formattedPending;
    else if (activeTab === 'rejected') currentList = formattedRejected;
    else if (activeTab === 'all') currentList = formattedAll;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    const paginatedProperties = currentList.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(currentList.length / limitNum) || 1;

    // Aggregate property ratings for the owner across their properties
    let ownerReviews = [];
    let avgOwnerRating = Number(user.rating) || 0;
    let totalOwnerReviews = Number(user.reviewCount) || 0;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    try {
      const PropertyReview = require('../../models/property-review.model');
      ownerReviews = await PropertyReview.find({ owner: ownerId })
        .populate('reviewer', 'name profilePicture phone role')
        .populate('property', 'title propertyType city locality price photos submissionId')
        .sort({ createdAt: -1 });

      totalOwnerReviews = ownerReviews.length;
      if (totalOwnerReviews > 0) {
        let sumRating = 0;
        ownerReviews.forEach((r) => {
          const star = Math.round(Number(r.rating) || 0);
          if (starCounts[star] !== undefined) starCounts[star]++;
          sumRating += Number(r.rating) || 0;
        });
        avgOwnerRating = Math.round((sumRating / totalOwnerReviews) * 10) / 10;
      }
    } catch (rErr) {
      console.error('Error fetching owner property reviews in getMyDashboard:', rErr.message);
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile: {
          id: user._id,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'owner',
          roleTitle,
          isVerified,
          verificationBadge,
          verificationStatus:
            user.role === 'builder'
              ? user.builderVerificationStatus || 'unverified'
              : user.role === 'agent'
              ? user.agentVerificationStatus || 'unverified'
              : user.isVerified
              ? 'approved'
              : 'unverified',
          address: user.address || {},
          formattedAddress,
          profilePicture: user.profilePicture || 'default-avatar.png',
          companyName: user.companyName || '',
          reraNumber: user.reraNumber || '',
          rating: avgOwnerRating,
          averageRating: avgOwnerRating,
          reviewsCount: totalOwnerReviews,
          totalReviews: totalOwnerReviews,
          ratings: {
            averageRating: avgOwnerRating,
            totalReviews: totalOwnerReviews,
            breakdown: starCounts,
            recentReviews: ownerReviews.slice(0, 5),
          },
        },
        ratings: {
          averageRating: avgOwnerRating,
          totalReviews: totalOwnerReviews,
          rating: avgOwnerRating,
          reviewsCount: totalOwnerReviews,
          breakdown: starCounts,
          recentReviews: ownerReviews.slice(0, 10),
          allReviews: ownerReviews,
        },
        counters: {
          totalListings,
          liveListings: liveListings.length,
          pendingListings: pendingListings.length,
          rejectedListings: rejectedListings.length,
          pendingTokens: effectivePendingTokens,
          acceptedTokens: effectiveAcceptedTokens,
        },
        tokenRequestsBanner: {
          count: effectivePendingTokens,
          title: `${effectivePendingTokens} new token requests`,
          subtitle: 'Awaiting your decision',
          hasPending: effectivePendingTokens > 0,
        },
        performance: {
          period: 'all',
          label: 'All Time',
          views: totalViews,
          shortlisted: totalShortlisted,
          inquiries: totalInquiries,
          tokensReceived: effectiveAcceptedTokens,
          totalTokenAmount,
        },
        tabs: {
          activeTab,
          counts: {
            live: liveListings.length,
            pending: pendingListings.length,
            rejected: rejectedListings.length,
            all: totalListings,
          },
        },
        myProperties: {
          live: formattedLive,
          pending: formattedPending,
          rejected: formattedRejected,
          all: formattedAll,
        },
        properties: paginatedProperties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: currentList.length,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve My Properties with tab filter (live, pending, rejected, all)
// @route   GET /api/user/properties/my-properties
// @access  Private
exports.getMyProperties = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { status = 'all', page = 1, limit = 10 } = req.query;

    const userProperties = await Property.find({ owner: ownerId })
      .populate('owner', 'name phone email role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber profilePicture address')
      .sort({ createdAt: -1 });

    const live = userProperties.filter((p) => p.approvalStatus === 'approved' && p.isLive);
    const pending = userProperties.filter((p) => p.approvalStatus === 'pending');
    const rejected = userProperties.filter((p) => p.approvalStatus === 'rejected');

    let filtered = userProperties;
    const s = (status || 'all').toLowerCase();
    if (s === 'live') filtered = live;
    else if (s === 'pending') filtered = pending;
    else if (s === 'rejected') filtered = rejected;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum).map((p) => formatPropertyCard(p, req.user));
    const totalPages = Math.ceil(filtered.length / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        properties: paginated,
        counts: {
          all: userProperties.length,
          live: live.length,
          pending: pending.length,
          rejected: rejected.length,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned property listing
// @route   PUT /api/user/properties/:id
// @access  Private (Owner/Agent/Builder who owns the property)
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    // Ownership check (allowed for listing owner or admin)
    const isAdmin = ['admin', 'superadmin', 'super_admin'].includes((req.user?.role || '').toLowerCase());
    if (!isAdmin && property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this listing.',
      });
    }

    const updateFields = { ...req.body };
    if (req.body.possessionDate !== undefined) {
      updateFields.possessionDate = normalizePossessionDate(req.body.possessionDate);
    }

    // 🛡️ Role-Based Update Guard: Users cannot change to another role outside their locked role
    if (!isAdmin) {
      const userRole = (req.user.role || '').toLowerCase().trim();
      const rawListingAs = (updateFields.listingAs || updateFields.role || '').toLowerCase().trim();

      if (rawListingAs) {
        const isTargetingDeveloper = rawListingAs.includes('builder') || rawListingAs.includes('developer');
        const isTargetingAgent = rawListingAs.includes('agent') || rawListingAs.includes('broker');
        const isTargetingOwner = rawListingAs.includes('owner');

        if (userRole === 'owner' && (isTargetingAgent || isTargetingDeveloper)) {
          return res.status(403).json({
            status: 'fail',
            message: 'Role Restriction: As a Property Owner, you cannot alter your listing to Agent or Developer role.',
          });
        }
        if (userRole === 'agent' && (isTargetingOwner || isTargetingDeveloper)) {
          return res.status(403).json({
            status: 'fail',
            message: 'Role Restriction: As an Agent, you cannot alter your listing to Owner or Developer role.',
          });
        }
        if ((userRole === 'builder' || userRole === 'developer') && (isTargetingOwner || isTargetingAgent)) {
          return res.status(403).json({
            status: 'fail',
            message: 'Role Restriction: As a Developer, you cannot alter your listing to Owner or Agent role.',
          });
        }
      }
    }

    // 🛡️ Security Deposit & Duration rule: Remove / clear for properties available for Sale or Resale
    const targetListingFor = updateFields.listingFor || property.listingFor;
    if (['sale', 'resale'].includes(String(targetListingFor || '').trim().toLowerCase())) {
      updateFields.securityDeposit = undefined;
      updateFields.securityDepositDuration = undefined;
    }

    // Handle multiple BHK configurations update: ONLY BHK and its Price
    if (updateFields.bhkConfigurations !== undefined) {
      let configs = updateFields.bhkConfigurations;
      if (typeof configs === 'string') {
        try {
          configs = JSON.parse(configs);
        } catch {
          configs = [];
        }
      }
      if (Array.isArray(configs)) {
        updateFields.bhkConfigurations = configs
          .map((item) => ({
            bhk: item.bhk || item.bhkType || '',
            bhkType: item.bhk || item.bhkType || '',
            price: Number(item.price) || 0,
          }))
          .filter((b) => b.bhk && b.price > 0);
      } else {
        updateFields.bhkConfigurations = [];
      }
    }

    // Handle multiple RERA registrations update
    if (updateFields.reraNumbers !== undefined || updateFields.reraNumber !== undefined) {
      let rawRera = updateFields.reraNumbers !== undefined ? updateFields.reraNumbers : updateFields.reraNumber;
      let parsedReraNumbers = [];
      if (typeof rawRera === 'string') {
        try {
          const parsed = JSON.parse(rawRera);
          if (Array.isArray(parsed)) parsedReraNumbers = parsed;
          else if (parsed && typeof parsed === 'object') parsedReraNumbers = [parsed];
          else if (parsed) parsedReraNumbers = [{ reraNumber: String(parsed) }];
        } catch {
          parsedReraNumbers = rawRera.includes(',')
            ? rawRera.split(',').map((r) => ({ reraNumber: r }))
            : [{ reraNumber: rawRera }];
        }
      } else if (Array.isArray(rawRera)) {
        parsedReraNumbers = rawRera;
      } else if (rawRera && typeof rawRera === 'object') {
        parsedReraNumbers = [rawRera];
      }

      parsedReraNumbers = parsedReraNumbers
        .map((item, idx) => {
          if (typeof item === 'string') {
            const trimmed = item.trim();
            return trimmed ? { name: `Phase ${idx + 1}`, reraNumber: trimmed } : null;
          }
          if (item && typeof item === 'object') {
            const num = String(item.reraNumber || item.number || item.id || '').trim();
            if (!num) return null;
            const nm = String(item.name || item.phase || item.phaseName || '').trim();
            return { name: nm, reraNumber: num };
          }
          return null;
        })
        .filter(Boolean);

      const seenRera = new Set();
      const uniqueReraNumbers = [];
      for (const r of parsedReraNumbers) {
        if (!seenRera.has(r.reraNumber)) {
          seenRera.add(r.reraNumber);
          uniqueReraNumbers.push(r);
        }
      }

      const isBuilderListing =
        (updateFields.userRole || property.userRole) === 'builder' ||
        String(updateFields.listingAs || property.listingAs || '').toLowerCase().includes('builder');
      const isPlot = String(updateFields.propertyType || property.propertyType || '').trim().toLowerCase().includes('plot');

      if (isBuilderListing && !isPlot && uniqueReraNumbers.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'At least one RERA registration number is mandatory for Developer/Builder project listings (except Plots).',
        });
      }
      updateFields.reraNumbers = uniqueReraNumbers;
    }

    // Normalize listingAs if provided in update
    if (updateFields.listingAs) {
      const lower = updateFields.listingAs.toLowerCase();
      if (lower.includes('builder') || lower.includes('developer')) {
        updateFields.listingAs = 'Developer / Builder';
        updateFields.userRole = 'builder';
        updateFields.postedByRole = 'Builder';
      } else if (lower.includes('agent') || lower.includes('broker')) {
        updateFields.listingAs = 'Agent / Broker';
        updateFields.userRole = 'agent';
        updateFields.postedByRole = 'Agent';
      } else {
        updateFields.listingAs = 'Owner';
        updateFields.userRole = 'owner';
        updateFields.postedByRole = 'Owner';
      }
    }

    const coordsProvided =
      updateFields.latitude !== undefined ||
      updateFields.longitude !== undefined ||
      updateFields.lat !== undefined ||
      updateFields.lng !== undefined ||
      updateFields.location !== undefined ||
      updateFields.city !== undefined ||
      updateFields.locality !== undefined ||
      updateFields.fullAddress !== undefined;

    if (coordsProvided) {
      const merged = { ...property.toObject(), ...updateFields };
      updateFields.location = {
        type: 'Point',
        coordinates: await resolveCoordinatesAsync(merged),
      };
      delete updateFields.latitude;
      delete updateFields.longitude;
      delete updateFields.lat;
      delete updateFields.lng;
    }

    // Process Installment details if provided or toggled
    if (updateFields.allowInstallments !== undefined || updateFields.installmentDetails !== undefined) {
      const targetPrice = updateFields.price !== undefined ? updateFields.price : property.price;
      const mergedBody = {
        allowInstallments: updateFields.allowInstallments !== undefined ? updateFields.allowInstallments : property.allowInstallments,
        installmentDetails: updateFields.installmentDetails !== undefined ? updateFields.installmentDetails : property.installmentDetails,
      };
      const installmentData = normalizeInstallmentData(mergedBody, targetPrice);
      updateFields.allowInstallments = installmentData.allowInstallments;
      updateFields.installmentDetails = installmentData.installmentDetails;
    }

    // ── 🛡️ MEDIA UPDATE & SEPARATION (Images & Videos) ───────────────────────
    if (
      updateFields.images !== undefined ||
      updateFields.photos !== undefined ||
      updateFields.videos !== undefined ||
      updateFields.propertyVideos !== undefined ||
      updateFields.video !== undefined ||
      updateFields.videoUrl !== undefined
    ) {
      const isMediaVideo = (url) => {
        if (!url || typeof url !== 'string') return false;
        try {
          const decoded = decodeURIComponent(url).toLowerCase();
          const cleanPath = decoded.split('?')[0];
          return (
            /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
            decoded.includes('/video/') ||
            decoded.includes('/videos/') ||
            decoded.includes('video/mp4') ||
            decoded.includes('format=mp4') ||
            decoded.includes('contenttype=video') ||
            decoded.includes('uploads%2fvideo') ||
            decoded.includes('uploads/video')
          );
        } catch (_) {
          return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
        }
      };

      let rawUpdateMedia = [];
      if (Array.isArray(updateFields.images)) rawUpdateMedia.push(...updateFields.images);
      if (Array.isArray(updateFields.photos)) rawUpdateMedia.push(...updateFields.photos);
      if (Array.isArray(updateFields.videos)) rawUpdateMedia.push(...updateFields.videos);
      if (Array.isArray(updateFields.propertyVideos)) rawUpdateMedia.push(...updateFields.propertyVideos);
      if (typeof updateFields.video === 'string' && updateFields.video) rawUpdateMedia.push(updateFields.video);
      if (typeof updateFields.videoUrl === 'string' && updateFields.videoUrl) rawUpdateMedia.push(updateFields.videoUrl);

      const updateImages = [];
      const updateVideos = [];

      for (const item of rawUpdateMedia) {
        if (typeof item !== 'string' || !item.trim()) continue;
        const trimmed = item.trim();
        if (isMediaVideo(trimmed)) {
          if (!updateVideos.includes(trimmed)) updateVideos.push(trimmed);
        } else {
          if (!updateImages.includes(trimmed)) updateImages.push(trimmed);
        }
      }

      updateFields.images = updateImages;
      updateFields.videos = updateVideos;
      updateFields.propertyVideos = updateVideos;
    }

    // Only reset status to pending when regular user updates
    if (!isAdmin) {
      updateFields.approvalStatus = 'pending';
      updateFields.isLive = false;
    }

    property = await Property.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber');

    res.status(200).json({
      status: 'success',
      message: 'Property listing updated and re-submitted for admin verification.',
      data: {
        property: enrichPropertyWithSellerRole(property, req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete owned property listing
// @route   DELETE /api/user/properties/:id
// @access  Private (Owner/Agent/Builder who owns the property)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this listing.',
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Property listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or set Key Handover status for a property
// @route   PATCH /api/user/properties/:id/key-handover
// @access  Private (Owner/Agent/Builder who owns the property or Admin)
exports.toggleKeyHandover = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property listing not found.',
      });
    }

    // Ownership check (Property owner or Admin)
    const isOwner = property.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || (req.user.constructor && req.user.constructor.modelName === 'Admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to modify this property listing.',
      });
    }

    // If keyHandover is explicitly passed as boolean/string, set it; otherwise toggle current value
    const newStatus = req.body.keyHandover !== undefined
      ? (req.body.keyHandover === true || req.body.keyHandover === 'true')
      : !property.keyHandover;

    property.keyHandover = newStatus;
    await property.save();

    res.status(200).json({
      status: 'success',
      message: `Key handover status updated to ${newStatus ? 'Ready for Handover' : 'Not Ready'}.`,
      data: {
        propertyId: property._id,
        keyHandover: property.keyHandover,
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve properties near me (geospatial proximity + city fallback)
// @route   GET /api/user/properties/near-me or GET /api/properties/near-me
// @access  Public
exports.getNearMeProperties = async (req, res, next) => {
  try {
    const {
      city,
      lat,
      lng,
      latitude,
      longitude,
      radius,
      distanceInKm,
      distance,
      maxDistance,
      radiusUnit = 'km',
      limit = 10,
      page = 1,
      keyHandover,
      category,
      listingFor,
      propertyType,
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isLive: true,
      isSold: { $ne: true },
      saleStatus: { $ne: 'sold' },
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (keyHandover !== undefined) {
      query.keyHandover = keyHandover === 'true' || keyHandover === true;
    }
    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');

    // 🛡️ NEAR-ME RULE: Strictly display ONLY Resale & Rent properties
    // (Developer/Builder inventory belongs to New Projects, not Near-Me Resale/Rentals)
    const cleanListingFor = (listingFor || req.query.type || '').trim().toLowerCase();

    const builderUsers = await User.find({ role: 'builder' }).select('_id');
    const builderUserIds = builderUsers.map((u) => u._id);

    const nonBuilderFilter = {
      postedByRole: { $nin: ['Builder', 'Developer'] },
      userRole: { $nin: ['builder', 'developer'] },
      listingAs: { $not: /builder|developer/i },
      owner: { $nin: builderUserIds },
    };

    const isResaleCondition = {
      listingFor: { $regex: /^(sale|resale)$/i },
      ...nonBuilderFilter,
    };

    const isRentCondition = {
      listingFor: { $in: ['Rent', 'Lease', 'PG', 'rent', 'lease', 'pg'] },
      ...nonBuilderFilter,
    };

    if (!query.$and) query.$and = [];

    if (cleanListingFor === 'rent' || cleanListingFor === 'lease' || cleanListingFor === 'pg') {
      query.listingFor = new RegExp(`^${cleanListingFor}$`, 'i');
      query.$and.push(nonBuilderFilter);
    } else if (cleanListingFor === 'resale' || cleanListingFor === 'sale') {
      query.$and.push(isResaleCondition);
    } else {
      query.$and.push({
        $or: [isRentCondition, isResaleCondition],
      });
    }

    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const isGeospatial =
      targetLat !== undefined &&
      targetLng !== undefined &&
      !isNaN(Number(targetLat)) &&
      !isNaN(Number(targetLng));

    // Flexible radius/distance parsing (handles "50.0", "50 km", distanceInKm, etc.)
    const rawRadius = radius ?? distanceInKm ?? distance ?? maxDistance ?? 50;
    const parsedRadius = parseFloat(rawRadius) || 50;

    let maxDistanceInKm = parsedRadius;
    const unit = (radiusUnit || '').toLowerCase().trim();
    if (unit === 'miles' || unit === 'mi') {
      maxDistanceInKm = parsedRadius * 1.60934;
    } else if (unit === 'meters' || unit === 'm') {
      maxDistanceInKm = parsedRadius / 1000;
    }

    const radiusInRadians = maxDistanceInKm / 6378.1;

    const hasValidCity = city && city !== 'null' && city !== 'undefined' && city.trim() !== '';
    const cleanCity = hasValidCity ? city.split(',')[0].trim() : null;

    if (isGeospatial) {
      const geoFilter = {
        location: {
          $geoWithin: {
            $centerSphere: [[Number(targetLng), Number(targetLat)], radiusInRadians],
          },
        },
      };

      if (cleanCity) {
        query.$or = [
          geoFilter,
          { city: new RegExp(`^${cleanCity}$`, 'i') },
          { city: new RegExp(cleanCity, 'i') },
        ];
      } else {
        query.location = geoFilter.location;
      }
    } else if (cleanCity) {
      query.city = new RegExp(cleanCity, 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Fetch matching properties
    const [rawProperties, total] = await Promise.all([
      Property.find(query)
        .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber')
        .lean(),
      Property.countDocuments(query),
    ]);

    // Compute exact distance and attach human-friendly distance metadata
    let properties = rawProperties.map((p) => {
      const userCoords = isGeospatial ? { lat: Number(targetLat), lng: Number(targetLng) } : null;
      const enriched = enrichPropertyWithSellerRole(p, null, userCoords);
      const isRent = ['rent', 'lease', 'pg'].includes((enriched.listingFor || '').toLowerCase());
      const isResale = !isRent;

      let distanceKm = enriched.distanceInKm;
      if (
        distanceKm === null &&
        isGeospatial &&
        enriched.location &&
        Array.isArray(enriched.location.coordinates) &&
        enriched.location.coordinates.length >= 2
      ) {
        const propLng = enriched.location.coordinates[0];
        const propLat = enriched.location.coordinates[1];
        distanceKm = calculateDistanceInKm(
          Number(targetLat),
          Number(targetLng),
          propLat,
          propLng
        );
      }
      return {
        ...enriched,
        isResale,
        isRent,
        listingIntent: isRent ? 'Rent' : 'Resale',
        distanceInKm: distanceKm,
        distanceMeters: distanceKm !== null ? Math.round(distanceKm * 1000) : null,
        distance: distanceKm !== null ? `${distanceKm} km` : null,
        distanceText: formatDistanceText(distanceKm),
      };
    });

    // Nearest first if geospatial coordinates provided; otherwise newest first
    if (isGeospatial) {
      properties.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });
    } else {
      properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const paginatedProperties = properties.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: paginatedProperties.length,
      totalCount: total,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties: paginatedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve all verified properties with pagination & optional filters
// @route   GET /api/properties/verified or GET /api/user/properties/verified
// @access  Public
exports.getVerifiedProperties = async (req, res, next) => {
  try {
    const {
      category,
      listingFor,
      propertyType,
      city,
      locality,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isLive: true,
      isSold: { $ne: true },
      saleStatus: { $ne: 'sold' },
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category)     query.category     = new RegExp(`^${category.trim()}$`, 'i');
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');
    if (city)         query.city         = new RegExp(city.trim(), 'i');
    if (locality)     query.locality     = new RegExp(locality.trim(), 'i');

    // 🛡️ VERIFIED PROPERTIES RULE: Strictly display ONLY Resale & Rent properties
    // (Developer/Builder primary projects belong to New Projects, not Resale/Rentals)
    const cleanListingFor = (listingFor || req.query.type || '').trim().toLowerCase();

    const builderUsers = await User.find({ role: 'builder' }).select('_id');
    const builderUserIds = builderUsers.map((u) => u._id);

    const nonBuilderFilter = {
      postedByRole: { $nin: ['Builder', 'Developer'] },
      userRole: { $nin: ['builder', 'developer'] },
      listingAs: { $not: /builder|developer/i },
      owner: { $nin: builderUserIds },
    };

    const isResaleCondition = {
      listingFor: { $regex: /^(sale|resale)$/i },
      ...nonBuilderFilter,
    };

    const isRentCondition = {
      listingFor: { $in: ['Rent', 'Lease', 'PG', 'rent', 'lease', 'pg'] },
      ...nonBuilderFilter,
    };

    if (!query.$and) query.$and = [];

    if (cleanListingFor === 'rent' || cleanListingFor === 'lease' || cleanListingFor === 'pg') {
      query.listingFor = new RegExp(`^${cleanListingFor}$`, 'i');
      query.$and.push(nonBuilderFilter);
    } else if (cleanListingFor === 'resale' || cleanListingFor === 'sale') {
      query.$and.push(isResaleCondition);
    } else {
      query.$and.push({
        $or: [isRentCondition, isResaleCondition],
      });
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and.push({
        $or: [
          { title: searchRegex },
          { city: searchRegex },
          { locality: searchRegex },
          { submissionId: searchRegex },
          { propertyType: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber')
        .lean(),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const enrichedProperties = properties.map((p) => {
      const enriched = enrichPropertyWithSellerRole(p);
      const isRent = ['rent', 'lease', 'pg'].includes((enriched.listingFor || '').toLowerCase());
      const isResale = !isRent;
      return {
        ...enriched,
        isResale,
        isRent,
        listingIntent: isRent ? 'Rent' : 'Resale',
      };
    });

    res.status(200).json({
      status: 'success',
      results: enrichedProperties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties: enrichedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve latest properties sorted by newest first with pagination & filters
// @route   GET /api/properties/latest or GET /api/user/properties/latest
// @access  Public
exports.getLatestProperties = async (req, res, next) => {
  try {
    const {
      category,
      listingFor,
      propertyType,
      city,
      locality,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isLive: true,
      isSold: { $ne: true },
      saleStatus: { $ne: 'sold' },
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (listingFor) {
      const cleanLF = (listingFor || '').trim().toLowerCase();
      if (cleanLF === 'resale') {
        const builderUsers = await User.find({ role: 'builder' }).select('_id');
        const builderUserIds = builderUsers.map((u) => u._id);
        const nonBuilder = {
          postedByRole: { $nin: ['Builder', 'Developer'] },
          userRole: { $nin: ['builder', 'developer'] },
          listingAs: { $not: /builder|developer/i },
          owner: { $nin: builderUserIds },
        };
        if (!query.$and) query.$and = [];
        query.$and.push({
          $or: [
            { listingFor: new RegExp(`^resale$`, 'i') },
            { listingFor: new RegExp(`^sale$`, 'i'), ...nonBuilder },
          ],
        });
      } else if (cleanLF === 'sale') {
        query.listingFor = new RegExp(`^(sale|resale)$`, 'i');
      } else {
        query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
      }
    }
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');
    if (city)         query.city         = new RegExp(city.trim(), 'i');
    if (locality)     query.locality     = new RegExp(locality.trim(), 'i');

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { submissionId: searchRegex },
        { propertyType: searchRegex },
        { description: searchRegex },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber'),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const enrichedProperties = properties.map((p) => enrichPropertyWithSellerRole(p, req.user));

    res.status(200).json({
      status: 'success',
      results: enrichedProperties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties: enrichedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve approved live developer/builder properties for New Projects, sorted nearest-first when location coordinates provided
// @route   GET /api/user/properties/new-projects or GET /api/properties/new-projects
// @route   GET /api/properties/new-projects/near-me
// @access  Public
exports.getNewProjectsProperties = async (req, res, next) => {
  try {
    const {
      category,
      propertyType,
      city,
      locality,
      minPrice,
      maxPrice,
      bedrooms,
      lat,
      lng,
      latitude,
      longitude,
      radius,
      distanceInKm,
      distance,
      maxDistance,
      radiusUnit = 'km',
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      isLive: true,
      isSold: { $ne: true },
      saleStatus: { $ne: 'sold' },
      // 🛡️ NEW PROJECTS RULE: Developer & Builder inventory strictly for Sale only
      listingFor: 'Sale',
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');
    if (locality) query.locality = new RegExp(locality.trim(), 'i');
    if (bedrooms) query.bedrooms = bedrooms;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🛡️ DEVELOPER / BUILDER FILTER ONLY
    const builderUsers = await User.find({ role: 'builder' }).select('_id');
    const builderUserIds = builderUsers.map((u) => u._id);

    const builderConditions = [
      { postedByRole: { $regex: /builder|developer/i } },
      { userRole: { $regex: /builder|developer/i } },
      { listingAs: { $regex: /builder|developer/i } },
    ];
    if (builderUserIds.length > 0) {
      builderConditions.push({ owner: { $in: builderUserIds } });
    }

    if (!query.$and) query.$and = [];
    query.$and.push({ $or: builderConditions });

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and.push({
        $or: [
          { title: searchRegex },
          { city: searchRegex },
          { locality: searchRegex },
          { submissionId: searchRegex },
          { propertyType: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    // ── Geospatial Proximity & Current Location ──────────────────────────
    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const isGeospatial =
      targetLat !== undefined &&
      targetLng !== undefined &&
      !isNaN(Number(targetLat)) &&
      !isNaN(Number(targetLng));

    const hasValidCity = city && city !== 'null' && city !== 'undefined' && city.trim() !== '';
    const cleanCity = hasValidCity ? city.split(',')[0].trim() : null;

    if (isGeospatial) {
      const rawRadius = radius ?? distanceInKm ?? distance ?? maxDistance ?? 50;
      const parsedRadius = parseFloat(rawRadius) || 50;

      let maxDistanceInKm = parsedRadius;
      const unit = (radiusUnit || '').toLowerCase().trim();
      if (unit === 'miles' || unit === 'mi') {
        maxDistanceInKm = parsedRadius * 1.60934;
      } else if (unit === 'meters' || unit === 'm') {
        maxDistanceInKm = parsedRadius / 1000;
      }
      const radiusInRadians = maxDistanceInKm / 6378.1;

      const geoFilter = {
        location: {
          $geoWithin: {
            $centerSphere: [[Number(targetLng), Number(targetLat)], radiusInRadians],
          },
        },
      };

      if (cleanCity) {
        query.$and.push({
          $or: [
            geoFilter,
            { city: new RegExp(`^${cleanCity}$`, 'i') },
            { city: new RegExp(cleanCity, 'i') },
          ],
        });
      } else {
        query.location = geoFilter.location;
      }
    } else if (cleanCity) {
      query.city = new RegExp(cleanCity, 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let [rawProperties, total] = await Promise.all([
      Property.find(query)
        .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber')
        .lean(),
      Property.countDocuments(query),
    ]);

    // If geospatial radius returned 0 developer projects, but coordinates were provided,
    // fallback gracefully to fetch all developer projects and sort nearest first
    if (isGeospatial && rawProperties.length === 0 && !cleanCity) {
      const fallbackQuery = { ...query };
      delete fallbackQuery.location;
      if (fallbackQuery.$and) {
        fallbackQuery.$and = fallbackQuery.$and.filter((c) => !c.location);
      }
      const [fallbackProps, fallbackTotal] = await Promise.all([
        Property.find(fallbackQuery)
          .populate('owner', 'name email phone profilePicture role isVerified builderVerificationStatus agentVerificationStatus companyName reraNumber')
          .lean(),
        Property.countDocuments(fallbackQuery),
      ]);
      rawProperties = fallbackProps;
      total = fallbackTotal;
    }

    // Compute exact distance and attach human-friendly distance metadata
    let properties = rawProperties.map((p) => {
      const userCoords = isGeospatial ? { lat: Number(targetLat), lng: Number(targetLng) } : null;
      const enriched = enrichPropertyWithSellerRole(p, req.user, userCoords);

      let distanceKm = enriched.distanceInKm;
      if (
        distanceKm === null &&
        isGeospatial &&
        enriched.location &&
        Array.isArray(enriched.location.coordinates) &&
        enriched.location.coordinates.length >= 2
      ) {
        const propLng = enriched.location.coordinates[0];
        const propLat = enriched.location.coordinates[1];
        distanceKm = calculateDistanceInKm(
          Number(targetLat),
          Number(targetLng),
          propLat,
          propLng
        );
      }

      return {
        ...enriched,
        isResale: false,
        isRent: false,
        isSale: true,
        listingIntent: 'Sale',
        displayListingFor: 'Sale',
        distanceInKm: distanceKm,
        distanceMeters: distanceKm !== null ? Math.round(distanceKm * 1000) : null,
        distance: distanceKm !== null ? `${distanceKm} km` : null,
        distanceText: formatDistanceText(distanceKm),
      };
    });

    // Nearest first if geospatial coordinates provided; otherwise newest first
    if (isGeospatial) {
      properties.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });
    } else {
      properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const paginatedProperties = properties.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: paginatedProperties.length,
      totalCount: total,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      userLocation: isGeospatial ? { latitude: Number(targetLat), longitude: Number(targetLng) } : null,
      isLocationSorted: isGeospatial,
      data: {
        properties: paginatedProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};



