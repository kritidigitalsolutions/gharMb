/**
 * App Property Listing Controller
 * Provides 5-step listing submission, editing, dashboard stats, and public search filters.
 */

const Property = require('../../models/property.model');
const User = require('../../models/user.model');
const Favorite = require('../../models/favorite.model');
const PropertyEnquiry = require('../../models/property-enquiry.model');
const TokenRequest = require('../../models/token-request.model');

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

// Well-known coordinates for Indian cities used for reliable geocoding fallback
const CITY_COORDINATES = {
  noida: [77.3910, 28.5355],
  delhi: [77.2090, 28.6139],
  'new delhi': [77.2090, 28.6139],
  gurgaon: [77.0266, 28.4595],
  gurugram: [77.0266, 28.4595],
  ghaziabad: [77.4538, 28.6692],
  faridabad: [77.3178, 28.4089],
  agra: [78.0081, 27.1767],
  agar: [78.0081, 27.1767],
  mumbai: [72.8777, 19.0760],
  pune: [73.8567, 18.5204],
  bangalore: [77.5946, 12.9716],
  bengaluru: [77.5946, 12.9716],
  hyderabad: [78.4867, 17.3850],
  kolkata: [88.3639, 22.5726],
  chennai: [80.2707, 13.0827],
  ahmedabad: [72.5714, 23.0225],
  jaipur: [75.7873, 26.9124],
  lucknow: [80.9462, 26.8467],
  chandigarh: [76.7794, 30.7333],
  meerut: [77.7064, 28.9845],
};

function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function resolveCoordinates(body = {}) {
  const targetLng =
    body.lng ??
    body.longitude ??
    body.location?.coordinates?.[0] ??
    body.location?.longitude ??
    body.location?.lng;
  const targetLat =
    body.lat ??
    body.latitude ??
    body.location?.coordinates?.[1] ??
    body.location?.latitude ??
    body.location?.lat;

  if (
    targetLng !== undefined &&
    targetLat !== undefined &&
    targetLng !== null &&
    targetLat !== null &&
    !isNaN(Number(targetLng)) &&
    !isNaN(Number(targetLat))
  ) {
    return [Number(targetLng), Number(targetLat)];
  }

  const cityName = (body.city || '').toLowerCase().trim();
  if (cityName && CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName];
  }

  return [77.3910, 28.5355]; // Sensible default (NCR/Noida)
}

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
const enrichPropertyWithSellerRole = (propertyDoc, fallbackOwner = null) => {
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

  // Enrich with Admin Commission & Commission-Absorbed Discount fields for Mobile App / Frontend
  const pricingMeta = getDiscountAndPricingMetadata(obj);
  Object.assign(obj, pricingMeta);

  return obj;
};

// Helper to compute discount on admin commission and effective pricing breakdown
const getDiscountAndPricingMetadata = (obj = {}) => {
  const price = Number(obj.price) || 0;
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
    photos: obj.photos || [],
    thumbnail: obj.photos && obj.photos.length > 0 ? obj.photos[0] : '',
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

    const query = { approvalStatus: 'approved', isLive: true };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (listingFor) query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');
    if (city) query.city = new RegExp(city.trim(), 'i');
    if (locality) query.locality = new RegExp(locality.trim(), 'i');
    if (bedrooms) query.bedrooms = bedrooms;

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

    // Geospatial proximity lookup (supports distanceInKm, radius, distance, maxDistance)
    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const rawDist = distanceInKm || radius || distance || maxDistance;
    if (targetLat && targetLng && rawDist) {
      const parsedDist = parseFloat(rawDist) || 50;
      const radiusInRadians = parsedDist / 6378.1;
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(targetLng), Number(targetLat)], radiusInRadians],
        },
      };
    }

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
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
    const enrichedProperties = properties.map((p) => enrichPropertyWithSellerRole(p));

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

    // Increment views only for approved live properties
    if (property.approvalStatus === 'approved' && property.isLive) {
      await Property.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    }

    const currentUserId = req.user?._id?.toString() || req.query.userId || req.query.currentUserId;
    const isOwner = Boolean(
      property.owner &&
      currentUserId &&
      (property.owner._id ? property.owner._id.toString() : property.owner.toString()) === currentUserId
    );

    const enrichedProperty = enrichPropertyWithSellerRole(property);

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

    res.status(200).json({
      status: 'success',
      data: {
        property: enrichedProperty,
        isOwner,
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
    const userRole = (user.role || '').toLowerCase();
    const rawListingAs = (req.body.listingAs || '').toLowerCase();

    // Determine normalized role and listingAs (Builder, Agent, Owner)
    let normalizedListingAs = 'Owner';
    let normalizedUserRole = userRole || 'owner';
    let normalizedPostedByRole = 'Owner';

    if (rawListingAs.includes('builder') || rawListingAs.includes('developer') || userRole === 'builder') {
      normalizedListingAs = 'Developer / Builder';
      normalizedUserRole = 'builder';
      normalizedPostedByRole = 'Builder';
    } else if (rawListingAs.includes('agent') || rawListingAs.includes('broker') || userRole === 'agent') {
      normalizedListingAs = 'Agent / Broker';
      normalizedUserRole = 'agent';
      normalizedPostedByRole = 'Agent';
    } else {
      normalizedListingAs = 'Owner';
      normalizedUserRole = 'owner';
      normalizedPostedByRole = 'Owner';
    }

    // 1. Agent Verification Guard: Agent must be verified & approved by Admin before uploading
    if (normalizedUserRole === 'agent' || normalizedListingAs === 'Agent / Broker') {
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
    if (normalizedUserRole === 'builder' || normalizedListingAs === 'Developer / Builder') {
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

    // 3. Prepare property data (Owner can upload directly, but property itself will require Admin verification)
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
    };

    // Robust location coordinates handling (never allow null coordinates)
    const resolvedCoords = resolveCoordinates(req.body);
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
      updateFields.city !== undefined;

    if (coordsProvided) {
      const merged = { ...property.toObject(), ...updateFields };
      updateFields.location = {
        type: 'Point',
        coordinates: resolveCoordinates(merged),
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
    if (listingFor) query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
    if (propertyType) query.propertyType = new RegExp(`^${propertyType.trim()}$`, 'i');

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

    if (isGeospatial) {
      const geoFilter = {
        location: {
          $geoWithin: {
            $centerSphere: [[Number(targetLng), Number(targetLat)], radiusInRadians],
          },
        },
      };

      if (city) {
        const cleanCity = city.split(',')[0].trim();
        query.$or = [
          geoFilter,
          { city: new RegExp(`^${cleanCity}$`, 'i') },
          { city: new RegExp(cleanCity, 'i') },
        ];
      } else {
        query.location = geoFilter.location;
      }
    } else if (city) {
      const cleanCity = city.split(',')[0].trim();
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
      const enriched = enrichPropertyWithSellerRole(p);
      let distanceKm = null;
      if (
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
        distanceInKm: distanceKm,
        distance: distanceKm !== null ? `${distanceKm} km` : null,
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
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category)     query.category     = new RegExp(`^${category.trim()}$`, 'i');
    if (listingFor)   query.listingFor   = new RegExp(`^${listingFor.trim()}$`, 'i');
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
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
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
    const enrichedProperties = properties.map((p) => enrichPropertyWithSellerRole(p));

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
    };

    // Exclude properties listed by current user in discovery feed
    const currentUserId = req.user?._id || req.query.userId || req.query.excludeOwner || req.query.currentUserId;
    if (req.query.owner) {
      query.owner = req.query.owner;
    } else if (currentUserId) {
      query.owner = { $ne: currentUserId };
    }

    if (category)     query.category     = new RegExp(`^${category.trim()}$`, 'i');
    if (listingFor)   query.listingFor   = new RegExp(`^${listingFor.trim()}$`, 'i');
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
    const enrichedProperties = properties.map((p) => enrichPropertyWithSellerRole(p));

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


