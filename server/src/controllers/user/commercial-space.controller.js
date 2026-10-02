/**
 * User Commercial Space Controller
 * Provides public search, featured listings, space types breakdown, near-me search,
 * detail retrieval, owner dashboard, creation, update, and deletion for commercial listings.
 * ALL GET endpoints implement clean, standard pagination.
 */

const CommercialSpace = require('../../models/commercial-space.model');

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
  const R = 6371;
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

  return [77.3910, 28.5355];
}

// Helper to sanitize page and limit values
const getPagination = (queryPage, queryLimit, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(queryPage, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryLimit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all approved live commercial spaces with filters & pagination
// @route   GET /api/commercial-spaces
// @access  Public
exports.getAllSpaces = async (req, res, next) => {
  try {
    const {
      spaceType,
      listingFor,
      minPrice,
      maxPrice,
      city,
      locality,
      furnishing,
      minArea,
      maxArea,
      search,
      lat,
      lng,
      latitude,
      longitude,
      radius,
      distanceInKm,
      distance,
      maxDistance,
      page = 1,
      limit = 20,
    } = req.query;

    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 20);

    const query = { approvalStatus: 'approved', isLive: true };

    if (spaceType)  query.spaceType  = new RegExp(`^${spaceType.trim()}$`, 'i');
    if (listingFor) query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
    if (city)       query.city       = new RegExp(city.trim(), 'i');
    if (locality)   query.locality   = new RegExp(locality.trim(), 'i');
    if (furnishing) query.furnishing = furnishing;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { spaceType: searchRegex },
        { description: searchRegex },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Carpet area range filter
    if (minArea || maxArea) {
      query.carpetArea = {};
      if (minArea) query.carpetArea.$gte = Number(minArea);
      if (maxArea) query.carpetArea.$lte = Number(maxArea);
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

    const [spaces, total] = await Promise.all([
      CommercialSpace.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name phone profilePicture role isVerified companyName'),
      CommercialSpace.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: spaces.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: { spaces },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured / premium commercial spaces with pagination
// @route   GET /api/commercial-spaces/featured
// @access  Public
exports.getFeaturedSpaces = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, spaceType } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const query = {
      approvalStatus: 'approved',
      isLive: true,
      listingTier: { $in: ['Featured', 'Premium'] },
    };

    if (spaceType) query.spaceType = spaceType;

    const [spaces, total] = await Promise.all([
      CommercialSpace.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name phone profilePicture role isVerified companyName'),
      CommercialSpace.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: spaces.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: { spaces },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest approved live commercial spaces with pagination
// @route   GET /api/commercial-spaces/latest
// @access  Public
exports.getLatestSpaces = async (req, res, next) => {
  try {
    const { spaceType, listingFor, city, page = 1, limit = 10 } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const query = {
      approvalStatus: 'approved',
      isLive: true,
    };

    if (spaceType)  query.spaceType  = new RegExp(`^${spaceType.trim()}$`, 'i');
    if (listingFor) query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');
    if (city)       query.city       = new RegExp(city.trim(), 'i');

    const [spaces, total] = await Promise.all([
      CommercialSpace.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name phone profilePicture role isVerified companyName'),
      CommercialSpace.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: spaces.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: { spaces },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get counts and summary by Commercial Space Type (Shop, Office, Showroom...)
// @route   GET /api/commercial-spaces/types
// @access  Public
exports.getSpaceTypes = async (req, res, next) => {
  try {
    const spaceTypes = [
      'Shop / Retail',
      'Office Space',
      'Showroom',
      'Warehouse',
      'Co-working',
      'Industrial Plot',
    ];

    const counts = await CommercialSpace.aggregate([
      { $match: { approvalStatus: 'approved', isLive: true } },
      { $group: { _id: '$spaceType', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => { countMap[c._id] = c.count; });

    const result = spaceTypes.map((type) => ({
      spaceType: type,
      totalListings: countMap[type] || 0,
    }));

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { types: result },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spaces near a location (geospatial or city-based) with pagination
// @route   GET /api/commercial-spaces/near-me
// @access  Public
exports.getNearMeSpaces = async (req, res, next) => {
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
      spaceType,
      listingFor,
    } = req.query;

    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const query = { approvalStatus: 'approved', isLive: true };
    if (spaceType) query.spaceType = new RegExp(`^${spaceType.trim()}$`, 'i');
    if (listingFor) query.listingFor = new RegExp(`^${listingFor.trim()}$`, 'i');

    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const isGeospatial =
      targetLat !== undefined &&
      targetLng !== undefined &&
      !isNaN(Number(targetLat)) &&
      !isNaN(Number(targetLng));

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

    const [rawSpaces, total] = await Promise.all([
      CommercialSpace.find(query)
        .populate('owner', 'name phone profilePicture role isVerified companyName')
        .lean(),
      CommercialSpace.countDocuments(query),
    ]);

    let spaces = rawSpaces.map((s) => {
      let distanceKm = null;
      if (
        isGeospatial &&
        s.location &&
        Array.isArray(s.location.coordinates) &&
        s.location.coordinates.length >= 2
      ) {
        const spaceLng = s.location.coordinates[0];
        const spaceLat = s.location.coordinates[1];
        distanceKm = calculateDistanceInKm(
          Number(targetLat),
          Number(targetLng),
          spaceLat,
          spaceLng
        );
      }
      return {
        ...s,
        id: s._id,
        distanceInKm: distanceKm,
        distance: distanceKm !== null ? `${distanceKm} km` : null,
      };
    });

    if (isGeospatial) {
      spaces.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });
    } else {
      spaces.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const paginatedSpaces = spaces.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      results: paginatedSpaces.length,
      total,
      totalCount: total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: { spaces: paginatedSpaces },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get commercial space detail (increments view count)
// @route   GET /api/commercial-spaces/:id
// @access  Public
exports.getSpaceDetails = async (req, res, next) => {
  try {
    const space = await CommercialSpace.findById(req.params.id)
      .populate('owner', 'name email phone profilePicture isVerified role address companyName');

    if (!space) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commercial space listing not found.',
      });
    }

    // Increment view count for live approved listings
    if (space.approvalStatus === 'approved' && space.isLive) {
      await CommercialSpace.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    }

    res.status(200).json({
      status: 'success',
      data: { space },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / submit a new commercial space listing for admin review
// @route   POST /api/commercial-spaces
// @access  Private (Owner / Agent / Builder)
exports.createSpace = async (req, res, next) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toLowerCase();
    const listingAs = (req.body.listingAs || '').toLowerCase();

    if (userRole === 'agent' || listingAs.includes('agent') || listingAs.includes('broker')) {
      if (user.agentVerificationStatus !== 'approved') {
        const reason = user.agentVerificationStatus === 'rejected'
          ? `Your Agent profile was rejected: ${user.agentRejectionReason || 'Please re-upload documents.'}`
          : 'Your Agent profile is under admin review. You can list once approved.';
        return res.status(403).json({ status: 'fail', message: reason });
      }
    }

    if (userRole === 'builder' || listingAs.includes('developer') || listingAs.includes('builder')) {
      if (user.builderVerificationStatus !== 'approved') {
        const reason = user.builderVerificationStatus === 'rejected'
          ? `Your Developer profile was rejected: ${user.builderRejectionReason || 'Please re-upload documents.'}`
          : 'Your Developer profile is under admin review. You can list once approved.';
        return res.status(403).json({ status: 'fail', message: reason });
      }
    }

    const spaceData = {
      ...req.body,
      owner: user._id,
      approvalStatus: 'pending',
      isLive: false,
    };

    const resolvedCoords = resolveCoordinates(req.body);
    spaceData.location = {
      type: 'Point',
      coordinates: resolvedCoords,
    };

    const space = await CommercialSpace.create(spaceData);

    try {
      const Admin = require('../../models/admin.model');
      const Notification = require('../../models/notification.model');
      const admins = await Admin.find().select('_id');
      if (admins.length > 0) {
        const notifications = admins.map((admin) => ({
          recipient: admin._id,
          title: 'New Commercial Space Pending Verification',
          message: `A new commercial listing "${space.title}" (${space.spaceType} - ${space.listingFor}) by ${user.name} requires verification.`,
          type: 'verification',
          isRead: false,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for commercial space:', notifErr);
    }

    res.status(201).json({
      status: 'success',
      message: 'Commercial space listing submitted! Admin will verify before it goes live.',
      data: {
        submissionId: space.submissionId,
        space,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's commercial space dashboard (stats + paginated listings)
// @route   GET /api/commercial-spaces/my-dashboard
// @access  Private
exports.getMyDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit, 10);

    const allSpaces = await CommercialSpace.find({ owner: ownerId }).sort({ createdAt: -1 });

    const live     = allSpaces.filter((s) => s.approvalStatus === 'approved' && s.isLive);
    const pending  = allSpaces.filter((s) => s.approvalStatus === 'pending');
    const rejected = allSpaces.filter((s) => s.approvalStatus === 'rejected');

    let totalViews = 0, totalShortlisted = 0, totalInquiries = 0;
    allSpaces.forEach((s) => {
      totalViews       += s.viewsCount       || 0;
      totalShortlisted += s.shortlistedCount || 0;
      totalInquiries   += s.inquiriesCount   || 0;
    });

    let filteredListings = allSpaces;
    if (status === 'live') filteredListings = live;
    else if (status === 'pending') filteredListings = pending;
    else if (status === 'rejected') filteredListings = rejected;

    const paginatedListings = filteredListings.slice(skip, skip + limitNum);
    const totalListings = filteredListings.length;
    const totalPages = Math.ceil(totalListings / limitNum) || 1;

    res.status(200).json({
      status: 'success',
      data: {
        profile: {
          id:         req.user._id,
          name:       req.user.name,
          email:      req.user.email,
          phone:      req.user.phone,
          role:       req.user.role,
          isVerified: req.user.isVerified,
        },
        counters: {
          totalListings:    allSpaces.length,
          liveListings:     live.length,
          pendingListings:  pending.length,
          rejectedListings: rejected.length,
        },
        performance: {
          views:       totalViews,
          shortlisted: totalShortlisted,
          inquiries:   totalInquiries,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalListings,
          totalPages,
          hasMore: pageNum < totalPages,
        },
        mySpaces: {
          paginated: paginatedListings,
          live,
          pending,
          rejected,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned commercial space listing (resets to pending)
// @route   PUT /api/commercial-spaces/:id
// @access  Private (owner of the listing)
exports.updateSpace = async (req, res, next) => {
  try {
    let space = await CommercialSpace.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ status: 'fail', message: 'Commercial space listing not found.' });
    }

    if (space.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'You do not own this listing.' });
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
      const merged = { ...space.toObject(), ...updateFields };
      updateFields.location = {
        type: 'Point',
        coordinates: resolveCoordinates(merged),
      };
      delete updateFields.latitude;
      delete updateFields.longitude;
      delete updateFields.lat;
      delete updateFields.lng;
    }

    updateFields.approvalStatus = 'pending';
    updateFields.isLive = false;

    space = await CommercialSpace.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Listing updated and re-submitted for admin verification.',
      data: { space },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete owned commercial space listing
// @route   DELETE /api/commercial-spaces/:id
// @access  Private (owner of the listing)
exports.deleteSpace = async (req, res, next) => {
  try {
    const space = await CommercialSpace.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ status: 'fail', message: 'Commercial space listing not found.' });
    }

    if (space.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'You do not own this listing.' });
    }

    await CommercialSpace.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Commercial space listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
