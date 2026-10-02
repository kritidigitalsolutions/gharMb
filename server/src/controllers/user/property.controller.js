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
        .populate('owner', 'name phone profilePicture role isVerified'),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: properties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties,
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
      .populate('owner', 'name email phone profilePicture isVerified role address');

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

    res.status(200).json({
      status: 'success',
      data: {
        property,
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
    const listingAs = (req.body.listingAs || '').toLowerCase();

    // 1. Agent Verification Guard: Agent must be verified & approved by Admin before uploading
    if (userRole === 'agent' || listingAs.includes('agent') || listingAs.includes('broker')) {
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
    if (userRole === 'builder' || listingAs.includes('developer') || listingAs.includes('builder')) {
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
    const propertyData = {
      ...req.body,
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
          isRead: false,
        }));
        await Notification.insertMany(notificationsData);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for property creation:', notifErr);
    }

    res.status(201).json({
      status: 'success',
      message: 'Property listing submitted successfully! Admin will verify and approve before it goes live.',
      data: {
        submissionId: property.submissionId,
        property,
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

    // Fetch all listings created by current user
    const userProperties = await Property.find({ owner: ownerId }).sort({ createdAt: -1 });

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

    // Helper to format property card
    const formatPropertyCard = (p) => {
      const obj = p.toObject ? p.toObject() : p;
      const localityPart = obj.locality ? obj.locality.trim() : '';
      const cityPart = obj.city ? obj.city.trim() : '';
      const locationText = [localityPart, cityPart].filter(Boolean).join(', ');
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
        createdAt: obj.createdAt,
      };
    };

    // Format list for each tab
    const formattedLive = liveListings.map(formatPropertyCard);
    const formattedPending = pendingListings.map(formatPropertyCard);
    const formattedRejected = rejectedListings.map(formatPropertyCard);
    const formattedAll = userProperties.map(formatPropertyCard);

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

    const userProperties = await Property.find({ owner: ownerId }).sort({ createdAt: -1 });

    const live = userProperties.filter((p) => p.approvalStatus === 'approved' && p.isLive);
    const pending = userProperties.filter((p) => p.approvalStatus === 'pending');
    const rejected = userProperties.filter((p) => p.approvalStatus === 'rejected');

    let filtered = userProperties;
    const s = (status || 'all').toLowerCase();
    if (s === 'live') filtered = live;
    else if (s === 'pending') filtered = pending;
    else if (s === 'rejected') filtered = rejected;

    const formatPropertyCard = (p) => {
      const obj = p.toObject ? p.toObject() : p;
      const localityPart = obj.locality ? obj.locality.trim() : '';
      const cityPart = obj.city ? obj.city.trim() : '';
      const locationText = [localityPart, cityPart].filter(Boolean).join(', ');
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
        createdAt: obj.createdAt,
      };
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum).map(formatPropertyCard);
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

    // Only reset status to pending when regular user updates
    if (!isAdmin) {
      updateFields.approvalStatus = 'pending';
      updateFields.isLive = false;
    }

    property = await Property.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Property listing updated and re-submitted for admin verification.',
      data: {
        property,
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
        .populate('owner', 'name phone profilePicture role isVerified companyName')
        .lean(),
      Property.countDocuments(query),
    ]);

    // Compute exact distance and attach human-friendly distance metadata
    let properties = rawProperties.map((p) => {
      let distanceKm = null;
      if (
        isGeospatial &&
        p.location &&
        Array.isArray(p.location.coordinates) &&
        p.location.coordinates.length >= 2
      ) {
        const propLng = p.location.coordinates[0];
        const propLat = p.location.coordinates[1];
        distanceKm = calculateDistanceInKm(
          Number(targetLat),
          Number(targetLng),
          propLat,
          propLng
        );
      }
      return {
        ...p,
        id: p._id,
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
        .populate('owner', 'name email phone profilePicture role isVerified companyName'),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: properties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties,
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
        .populate('owner', 'name email phone profilePicture role isVerified companyName'),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: properties.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: {
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
};


