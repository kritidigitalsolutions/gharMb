/**
 * App Property Listing Controller
 * Provides 5-step listing submission, editing, dashboard stats, and public search filters.
 */

const Property = require('../../models/property.model');

// @desc    Retrieve approved live properties for search feed
// @route   GET /api/app/properties
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
      distanceInKm,
    } = req.query;

    const query = { approvalStatus: 'approved', isLive: true };

    if (category) query.category = category;
    if (listingFor) query.listingFor = listingFor;
    if (propertyType) query.propertyType = propertyType;
    if (city) query.city = new RegExp(city, 'i');
    if (locality) query.locality = new RegExp(locality, 'i');
    if (bedrooms) query.bedrooms = bedrooms;

    // Price range filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Geospatial proximity lookup
    if (lat && lng && distanceInKm) {
      const radiusInRadians = Number(distanceInKm) / 6378.1;
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians],
        },
      };
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .populate('owner', 'name phone profilePicture role isVerified');

    res.status(200).json({
      status: 'success',
      results: properties.length,
      data: {
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve detailed property listing (increments view count)
// @route   GET /api/app/properties/:id
// @access  Public
exports.getPropertyDetails = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('owner', 'name email phone profilePicture isVerified role address');

    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found.',
      });
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
// @route   POST /api/app/properties
// @access  Private (Owner/Agent/Builder)
exports.createProperty = async (req, res, next) => {
  try {
    const propertyData = {
      ...req.body,
      owner: req.user._id,
      approvalStatus: 'pending',
      isLive: false,
    };

    // Location coordinates handling
    if (req.body.longitude && req.body.latitude) {
      propertyData.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    const property = await Property.create(propertyData);

    res.status(201).json({
      status: 'success',
      message: 'Property listing submitted for admin verification.',
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
// @route   GET /api/app/properties/my-dashboard
// @access  Private
exports.getMyDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // Fetch all listings created by current user
    const userProperties = await Property.find({ owner: ownerId }).sort({ createdAt: -1 });

    const totalListings = userProperties.length;
    const liveListings = userProperties.filter((p) => p.approvalStatus === 'approved' && p.isLive);
    const pendingListings = userProperties.filter((p) => p.approvalStatus === 'pending');
    const rejectedListings = userProperties.filter((p) => p.approvalStatus === 'rejected');

    // Aggregate metrics
    let totalViews = 0;
    let totalShortlisted = 0;
    let totalInquiries = 0;
    let totalTokens = 0;

    userProperties.forEach((p) => {
      totalViews += p.viewsCount || 0;
      totalShortlisted += p.shortlistedCount || 0;
      totalInquiries += p.inquiriesCount || 0;
      totalTokens += p.tokensCount || 0;
    });

    res.status(200).json({
      status: 'success',
      data: {
        profile: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
          isVerified: req.user.isVerified,
          address: req.user.address,
        },
        counters: {
          totalListings,
          liveListings: liveListings.length,
          pendingListings: pendingListings.length,
          rejectedListings: rejectedListings.length,
          pendingTokens: totalTokens,
          acceptedTokens: 2, // Example token count
        },
        performance: {
          views: totalViews,
          shortlisted: totalShortlisted,
          inquiries: totalInquiries,
          tokensReceived: totalTokens,
        },
        myProperties: {
          live: liveListings,
          pending: pendingListings,
          rejected: rejectedListings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned property listing
// @route   PUT /api/app/properties/:id
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

    // Ownership check
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this listing.',
      });
    }

    const updateFields = { ...req.body };
    if (updateFields.latitude && updateFields.longitude) {
      updateFields.location = {
        type: 'Point',
        coordinates: [Number(updateFields.longitude), Number(updateFields.latitude)],
      };
      delete updateFields.latitude;
      delete updateFields.longitude;
    }

    // Reset status to pending on update
    updateFields.approvalStatus = 'pending';
    updateFields.isLive = false;

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
// @route   DELETE /api/app/properties/:id
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
