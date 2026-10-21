/**
 * App Enquiry Controller
 * Manages lead generation and viewing for buyers/tenants and listing owners.
 */

const PropertyEnquiry = require('../../models/property-enquiry.model');
const Property = require('../../models/property.model');
const Project = require('../../models/project.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');
const { notifyAdmin } = require('../../utils/adminNotification.helper');
const { checkPropertyOwnership, checkDeveloperOwnership } = require('../../utils/ownershipCheck.helper');

// @desc    Submit an enquiry for a property or developer project (Inquiry Now)
// @route   POST /api/users/enquiries OR POST /api/enquiries
// @access  Public / Optional Auth (Logged in or guest)
exports.createEnquiry = async (req, res, next) => {
  try {
    const {
      propertyId,
      projectId,
      developerId,
      message = 'Inquiry sent to GharMB Admin.',
      visitPreferredDate,
      visitTimeSlot,
      channel = 'Portal Form',
      budget,
    } = req.body;

    // Resolve client contact details (authenticated user or payload)
    const clientName = (req.user?.name || req.body.name || req.body.fullName || req.body.clientName || 'Prospective Client').trim();
    const clientPhone = (req.user?.phone || req.body.phone || req.body.mobile || req.body.clientPhone || '').trim();
    const clientEmail = (req.user?.email || req.body.email || req.body.clientEmail || '').trim().toLowerCase();

    if (!clientPhone && !clientEmail && !req.user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide at least a phone number or email so our admin team can contact you.',
      });
    }

    const clientDetails = {
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
    };

    const scheduleDetails = (visitPreferredDate || visitTimeSlot)
      ? {
          date: visitPreferredDate ? new Date(visitPreferredDate).toLocaleDateString('en-IN') : undefined,
          time: visitTimeSlot || undefined,
        }
      : undefined;

    const scheduleNote = scheduleDetails
      ? ` | Scheduled Visit: ${scheduleDetails.date || ''} ${scheduleDetails.time || ''}`
      : '';

    // --- CASE 1: DEVELOPER PROJECT INQUIRY ---
    if (projectId || (!propertyId && (req.body.projectName || req.body.developerName))) {
      let project = null;
      if (projectId) {
        project = await Project.findById(projectId).populate('developer', 'name companyName phone email');
      }

      const projectName = project?.projectName || req.body.projectName || 'Developer Project';
      const developerName = project?.developerName || project?.developer?.companyName || project?.developer?.name || req.body.developerName || 'Developer';
      const developerIdVal = project?.developer?._id || project?.developer || developerId;

      // Prevent self-enquiring if authenticated as developer
      if (project && req.user) {
        const ownership = checkDeveloperOwnership(project.developer || { _id: project.developer }, req.user, req.body);
        if (ownership.isOwner) {
          return res.status(403).json({
            status: 'fail',
            success: false,
            isOwnerBlocked: true,
            message: 'Action not allowed: Developers cannot submit enquiries on their own projects.',
          });
        }
      }

      const enquiry = await DeveloperEnquiry.create({
        developer: developerIdVal,
        developerName,
        project: project?._id,
        projectName,
        client: req.user?._id,
        clientDetails,
        message,
        visitPreferredDate: visitPreferredDate ? new Date(visitPreferredDate) : undefined,
        visitTimeSlot,
        budget: budget || (project?.bhkConfigurations?.[0]?.minPrice ? `₹${project.bhkConfigurations[0].minPrice}` : undefined),
        channel: channel || 'Project Enquiry Form',
        status: 'pending',
      });

      // Increment project inquiries count
      if (project) {
        await Project.findByIdAndUpdate(project._id, { $inc: { inquiriesCount: 1 } }).catch(() => {});
      }

      // Notify GharMB Admin Notification Panel directly
      await notifyAdmin({
        title: 'New Project Enquiry 🏢',
        message: `${clientName} (${clientPhone || clientEmail}) submitted an enquiry for project "${projectName}" (${developerName}). Message: "${message}"${scheduleNote}`,
        type: 'enquiry',
        senderId: req.user?._id,
        metadata: {
          projectId: project?._id,
          developerId: developerIdVal,
          enquiryId: enquiry._id,
          clientDetails,
          scheduleDetails,
          customLink: '/admin/enquiries?tab=developer',
        },
      });

      return res.status(201).json({
        status: 'success',
        message: 'Inquiry received by GharMB Admin. Our project coordinator will contact you shortly.',
        data: {
          enquiry,
          type: 'project',
        },
      });
    }

    // --- CASE 2: PROPERTY LISTING INQUIRY ---
    let property = null;
    if (propertyId) {
      property = await Property.findById(propertyId).populate('owner', 'name phone email role');
      if (property && property.approvalStatus === 'rejected') {
        return res.status(404).json({
          status: 'fail',
          message: 'Property listing is currently unavailable for enquiry.',
        });
      }

      // Prevent self-enquiring by property owner
      if (property) {
        const ownership = checkPropertyOwnership(property, req.user, { ...req.body, phone: clientPhone, email: clientEmail });
        if (ownership.isOwner) {
          return res.status(403).json({
            status: 'fail',
            success: false,
            isOwnerBlocked: true,
            message: ownership.message || 'Action not allowed: You cannot submit an enquiry on your own property listing.',
          });
        }
      }
    }

    const propTitle = property?.title || req.body.propertyName || req.body.title || 'General Real Estate Listing';
    const location = property?.locality ? `${property.locality}, ${property.city}` : property?.city || req.body.location || '';

    const enquiry = await PropertyEnquiry.create({
      property: property?._id,
      propertyName: propTitle,
      location,
      client: req.user?._id,
      clientDetails,
      message,
      visitPreferredDate: visitPreferredDate ? new Date(visitPreferredDate) : undefined,
      visitTimeSlot,
      budget: budget || (property?.price ? `₹${property.price}` : undefined),
      channel: channel || 'Property Enquiry Form',
      status: 'pending',
    });

    // Increment property inquiries count
    if (property) {
      await Property.findByIdAndUpdate(property._id, { $inc: { inquiriesCount: 1 } }).catch(() => {});
    }

    // Notify GharMB Admin Notification Panel directly
    await notifyAdmin({
      title: 'New Property Enquiry 📩',
      message: `${clientName} (${clientPhone || clientEmail}) submitted an enquiry for listing "${propTitle}". Message: "${message}"${scheduleNote}`,
      type: 'enquiry',
      senderId: req.user?._id,
      metadata: {
        propertyId: property?._id,
        enquiryId: enquiry._id,
        clientDetails,
        scheduleDetails,
        customLink: '/admin/enquiries?tab=property',
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Inquiry received by GharMB Admin. Our property coordinator will contact you shortly.',
      data: {
        enquiry,
        type: 'property',
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

    const clientName = (req.user?.name || req.body.name || req.body.fullName || req.body.clientName || 'Prospective Buyer').trim();
    const clientPhone = (req.user?.phone || req.body.phone || req.body.mobile || req.body.clientPhone || '').trim();
    const clientEmail = (req.user?.email || req.body.email || req.body.clientEmail || '').trim().toLowerCase();

    const clientDetails = {
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
    };

    const projectId = req.body.projectId || req.body.project;
    let projectName = req.body.projectName;
    if (projectId && !projectName) {
      const prj = await Project.findById(projectId).select('projectName');
      if (prj) projectName = prj.projectName;
    }

    const visitPreferredDate = req.body.visitPreferredDate ? new Date(req.body.visitPreferredDate) : undefined;
    const visitTimeSlot = req.body.visitTimeSlot || undefined;

    // 3. Create enquiry
    const enquiry = await DeveloperEnquiry.create({
      developer: developerId,
      developerName: developer.companyName || developer.name,
      project: projectId,
      projectName,
      client: req.user?._id,
      clientDetails,
      message,
      visitPreferredDate,
      visitTimeSlot,
      status: 'pending',
    });

    // 5. Notify GharMB Admin Notification Panel directly
    const targetLabel = projectName ? `project "${projectName}" (${developer.companyName || developer.name})` : `builder/developer "${developer.companyName || developer.name}"`;
    await notifyAdmin({
      title: 'New Developer Enquiry 🏢',
      message: `${clientName} (${clientPhone || clientEmail}) submitted an enquiry for ${targetLabel}. Message: "${message}"`,
      type: 'enquiry',
      senderId: req.user?._id,
      metadata: {
        enquiryId: enquiry._id,
        developerId,
        projectId,
        clientDetails,
        customLink: '/admin/enquiries?tab=developer',
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Enquiry submitted successfully to GharMB Admin.',
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

