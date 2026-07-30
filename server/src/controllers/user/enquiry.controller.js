/**
 * App Enquiry Controller
 * Manages lead generation and viewing for buyers/tenants and listing owners.
 */

const PropertyEnquiry = require('../../models/property-enquiry.model');
const Property = require('../../models/property.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');

// @desc    Submit an enquiry for a property listing
// @route   POST /api/users/enquiries
// @access  Private (Buyer/Tenant only)
exports.createEnquiry = async (req, res, next) => {
  try {
    const { propertyId, message, visitPreferredDate, visitTimeSlot } = req.body;

    const property = await Property.findById(propertyId);
    if (!property || property.status !== 'approved') {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found or unavailable for enquiry.',
      });
    }

    // Prevent self-enquiring
    if (property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit an enquiry on your own property listing.',
      });
    }

    const enquiry = await PropertyEnquiry.create({
      property: propertyId,
      client: req.user._id,
      message,
      visitPreferredDate,
      visitTimeSlot,
      status: 'pending',
    });

    // Notify property owner about the new lead
    await Notification.create({
      recipient: property.owner,
      title: 'New Property Enquiry',
      message: `${req.user.name} has queried about your listing "${property.title}".`,
      type: 'enquiry',
      metadata: {
        propertyId: property._id,
        enquiryId: enquiry._id,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enquiries sent by current buyer/tenant
// @route   GET /api/users/enquiries/my-enquiries
// @access  Private (Buyer/Tenant only)
exports.getMyEnquiries = async (req, res, next) => {
  try {
    const enquiries = await PropertyEnquiry.find({ client: req.user._id })
      .populate({
        path: 'property',
        select: 'title price address images owner',
        populate: {
          path: 'owner',
          select: 'name email phone',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: enquiries.length,
      data: {
        enquiries,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enquiries received for properties owned by current seller/agent/builder
// @route   GET /api/users/enquiries/received
// @access  Private (Owner/Agent/Builder only)
exports.getReceivedEnquiries = async (req, res, next) => {
  try {
    // 1. Get properties owned by the current user
    const properties = await Property.find({ owner: req.user._id }).select('_id');
    const propertyIds = properties.map((p) => p._id);

    // 2. Fetch enquiries linked to these properties
    const enquiries = await PropertyEnquiry.find({ property: { $in: propertyIds } })
      .populate('client', 'name email phone')
      .populate('property', 'title price address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: enquiries.length,
      data: {
        enquiries,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of an enquiry (contacted/resolved)
// @route   PATCH /api/users/enquiries/:id
// @access  Private (Owner/Agent/Builder who owns the referenced property)
exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status, agentNotes } = req.body;

    const enquiry = await PropertyEnquiry.findById(req.params.id).populate('property');
    if (!enquiry) {
      return res.status(404).json({
        status: 'fail',
        message: 'Enquiry not found.',
      });
    }

    // Check ownership of the underlying property
    if (enquiry.property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update enquiries on this listing.',
      });
    }

    if (status) enquiry.status = status;
    if (agentNotes) enquiry.agentNotes = agentNotes;

    await enquiry.save();

    res.status(200).json({
      status: 'success',
      message: 'Enquiry details updated.',
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an enquiry for a developer/builder profile
// @route   POST /api/users/enquiries/developer
// @access  Private (Buyer/Tenant only)
exports.createDeveloperEnquiry = async (req, res, next) => {
  try {
    const { developerId, message } = req.body;

    if (!developerId || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide developer ID and enquiry message.',
      });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid developer ID format.',
      });
    }

    // 1. Verify developer exists and is a builder
    const developer = await User.findOne({ _id: developerId, role: 'builder' });
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer profile not found.',
      });
    }

    // 2. Prevent self-enquiring
    if (developerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot submit an enquiry to your own developer profile.',
      });
    }

    // 3. Create enquiry
    const enquiry = await DeveloperEnquiry.create({
      developer: developerId,
      client: req.user._id,
      message,
      status: 'pending',
    });

    // 4. Notify developer
    await Notification.create({
      recipient: developerId,
      title: 'New Developer Enquiry',
      message: `${req.user.name} has submitted an enquiry regarding your developer profile.`,
      type: 'enquiry',
      metadata: {
        enquiryId: enquiry._id,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Enquiry submitted successfully to developer.',
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

