/**
 * App Enquiry Controller
 * Manages lead generation and viewing for buyers/tenants and listing owners.
 */

const PropertyEnquiry = require('../../models/property-enquiry.model');
const Property = require('../../models/property.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');
const { notifyAdmin } = require('../../utils/adminNotification.helper');
const { checkPropertyOwnership, checkDeveloperOwnership } = require('../../utils/ownershipCheck.helper');

// @desc    Submit an enquiry for a property listing
// @route   POST /api/users/enquiries
// @access  Private (Buyer/Tenant only)
exports.createEnquiry = async (req, res, next) => {
  try {
    const { propertyId, message, visitPreferredDate, visitTimeSlot } = req.body;

    const property = await Property.findById(propertyId).populate('owner', 'name phone email role');
    if (!property || property.approvalStatus === 'rejected') {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found or unavailable for enquiry.',
      });
    }

    // 🛡️ Prevent self-enquiring
    const ownership = checkPropertyOwnership(property, req.user, req.body);
    if (ownership.isOwner) {
      return res.status(403).json({
        status: 'fail',
        success: false,
        isOwnerBlocked: true,
        message: ownership.message || 'Action not allowed: You cannot submit an enquiry on your own property listing.',
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

    // Inquiries are handled exclusively by Admin (owner is not notified)

    // Notify Admin Notification Panel directly
    await notifyAdmin({
      title: 'New Property Enquiry 📩',
      message: `${req.user.name || 'A user'} submitted an enquiry for listing "${property.title}". Phone: ${req.user.phone || 'N/A'}${message ? ` | Message: "${message}"` : ''}`,
      type: 'enquiry',
      senderId: req.user._id,
      metadata: {
        propertyId: property._id,
        enquiryId: enquiry._id,
        clientDetails: {
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
        },
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
    const developerId =
      req.params.id ||
      req.params.developerId ||
      req.body.developerId ||
      req.body.developer ||
      req.body.id;

    const message = req.body.message || req.body.enquiry || req.body.comment;

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

    // 1. Verify developer exists
    let developer = await User.findOne({ _id: developerId, role: 'builder' });
    if (!developer) {
      developer = await User.findById(developerId);
    }
    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer profile not found.',
      });
    }

    // 2. 🛡️ Prevent self-enquiring to developer profile
    const devOwnership = checkDeveloperOwnership(developer, req.user, req.body);
    if (devOwnership.isOwner) {
      return res.status(403).json({
        status: 'fail',
        success: false,
        isOwnerBlocked: true,
        message: devOwnership.message || 'Action not allowed: You cannot submit an enquiry to your own developer profile.',
      });
    }

    // 3. Create enquiry
    const enquiry = await DeveloperEnquiry.create({
      developer: developerId,
      client: req.user._id,
      message,
      status: 'pending',
    });

    // Developer inquiries are handled exclusively by Admin (developer is not notified directly)

    // 5. Notify Admin Notification Panel directly
    await notifyAdmin({
      title: 'New Developer Enquiry 🏢',
      message: `${req.user.name || 'A user'} submitted an enquiry for builder/developer "${developer.name}". Phone: ${req.user.phone || 'N/A'}${message ? ` | Message: "${message}"` : ''}`,
      type: 'enquiry',
      senderId: req.user._id,
      metadata: {
        enquiryId: enquiry._id,
        clientDetails: {
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
        },
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

