/**
 * Admin User Controller
 * Allows admins to view profiles, verify RERA Agent documents, verify Developer company documents, and manage users.
 */

const User = require('../../models/user.model');

// Helper to normalize phone numbers (+91XXXXXXXXXX)
const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
};

// @desc    Get all users (with filters & search)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isVerified, agentVerificationStatus, builderVerificationStatus, search, status } = req.query;
    const conditions = [];

    if (role && role !== 'All') {
      if (role === 'Buyer') conditions.push({ role: 'buyer' });
      else if (role === 'Seller') conditions.push({ role: 'owner' });
      else if (role === 'Agent' || role.toLowerCase() === 'agent') {
        conditions.push({
          $or: [
            { role: 'agent' },
            { agentVerificationStatus: { $in: ['pending', 'approved', 'rejected'] } },
          ],
        });
      } else if (role === 'Builder' || role.toLowerCase() === 'builder') {
        conditions.push({
          $or: [
            { role: 'builder' },
            { builderVerificationStatus: { $in: ['pending', 'approved', 'rejected'] } },
          ],
        });
      } else {
        conditions.push({ role: role.toLowerCase() });
      }
    }
    if (isVerified) conditions.push({ isVerified: isVerified === 'true' });
    if (agentVerificationStatus) conditions.push({ agentVerificationStatus });
    if (builderVerificationStatus) conditions.push({ builderVerificationStatus });
    if (status) conditions.push({ status });

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { reraNumber: { $regex: search, $options: 'i' } },
          { cityOfOperation: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const page = parseInt(req.query.page, 10) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    const skip = (page - 1) * (limit || 0);

    const totalUsers = await User.countDocuments(filter);
    let query = User.find(filter).sort({ createdAt: -1 });
    if (limit) {
      query = query.skip(skip).limit(limit);
    }
    const users = await query;

    // Fetch dynamic listings counts and property owner ratings for each user
    const Property = require('../../models/property.model');
    const PropertyReview = require('../../models/property-review.model');
    const usersWithListings = await Promise.all(
      users.map(async (u) => {
        const [count, reviewStats] = await Promise.all([
          Property.countDocuments({ owner: u._id }),
          PropertyReview.aggregate([
            { $match: { owner: u._id } },
            {
              $group: {
                _id: '$owner',
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
              },
            },
          ]),
        ]);
        const userObj = u.toObject();
        userObj.listings = count;
        if (reviewStats.length > 0) {
          userObj.rating = Math.round(reviewStats[0].avgRating * 10) / 10;
          userObj.reviewsCount = reviewStats[0].totalReviews;
          userObj.averageRating = userObj.rating;
        } else {
          userObj.rating = u.rating || 0;
          userObj.reviewsCount = u.reviewCount || 0;
          userObj.averageRating = u.rating || 0;
        }
        return userObj;
      })
    );

    res.status(200).json({
      status: 'success',
      results: usersWithListings.length,
      pagination: limit ? {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      } : undefined,
      data: {
        users: usersWithListings,
        total: totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending agent verification applications
// @route   GET /api/admin/users/pending-agents
// @access  Private (Admin only)
exports.getPendingAgents = async (req, res, next) => {
  try {
    const pendingAgents = await User.find({
      $or: [
        { role: 'agent', agentVerificationStatus: 'pending' },
        { agentVerificationStatus: 'pending' },
      ],
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: pendingAgents.length,
      data: {
        agents: pendingAgents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending developer/builder verification applications
// @route   GET /api/admin/users/pending-developers
// @access  Private (Admin only)
exports.getPendingDevelopers = async (req, res, next) => {
  try {
    const pendingDevelopers = await User.find({
      role: 'builder',
      builderVerificationStatus: 'pending',
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: pendingDevelopers.length,
      data: {
        developers: pendingDevelopers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed user profile
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject Agent RERA Verification Application
// @route   PATCH /api/admin/users/:id/verify-agent
// @access  Private (Admin only)
exports.verifyAgent = async (req, res, next) => {
  try {
    const rawStatus = req.body.agentVerificationStatus || req.body.status;
    const rejectionReason = req.body.agentRejectionReason || req.body.rejectionReason || req.body.rejectReason;

    if (!rawStatus || !['approved', 'rejected', 'pending', 'unverified'].includes(rawStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid agentVerificationStatus or status (approved, rejected, pending, unverified) is required.',
      });
    }

    const updateData = {
      agentVerificationStatus: rawStatus,
      isVerified: rawStatus === 'approved',
    };

    if (rawStatus === 'approved') {
      updateData.role = 'agent';
      updateData.agentRejectionReason = undefined;
    } else if (rawStatus === 'rejected' && rejectionReason) {
      updateData.agentRejectionReason = rejectionReason;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    // Send notification to the Agent
    try {
      const Notification = require('../../models/notification.model');
      if (rawStatus === 'approved') {
        await Notification.create({
          recipient: user._id,
          title: 'Agent Profile Verified & Approved! 🎉',
          message: 'Congratulations! Your Agent RERA profile and verification documents have been verified and approved by admin. You can now upload and manage property listings.',
          type: 'verification',
          isRead: false,
        });
      } else if (rawStatus === 'rejected') {
        await Notification.create({
          recipient: user._id,
          title: 'Agent Profile Verification Update',
          message: `Your Agent profile verification could not be approved. Reason: ${rejectionReason || 'Please check your submitted documents and re-apply.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating user notification for agent verification:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `Agent verification status updated to ${rawStatus}.`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject Developer/Builder Verification Application
// @route   PATCH /api/admin/users/:id/verify-developer
// @access  Private (Admin only)
exports.verifyDeveloper = async (req, res, next) => {
  try {
    const rawStatus = req.body.builderVerificationStatus || req.body.status;
    const rejectionReason = req.body.builderRejectionReason || req.body.rejectionReason || req.body.rejectReason;

    if (!rawStatus || !['approved', 'rejected', 'pending', 'unverified'].includes(rawStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid builderVerificationStatus or status (approved, rejected, pending, unverified) is required.',
      });
    }

    const updateData = {
      builderVerificationStatus: rawStatus,
      isVerified: rawStatus === 'approved',
    };

    if (rawStatus === 'approved') {
      updateData.role = 'builder';
      updateData.builderRejectionReason = undefined;
    } else if (rawStatus === 'rejected' && rejectionReason) {
      updateData.builderRejectionReason = rejectionReason;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    // Send notification to the Developer
    try {
      const Notification = require('../../models/notification.model');
      if (rawStatus === 'approved') {
        await Notification.create({
          recipient: user._id,
          title: 'Developer Profile Verified & Approved! 🎉',
          message: 'Congratulations! Your Developer profile and company documents have been verified and approved by admin. You can now upload and manage builder projects.',
          type: 'verification',
          isRead: false,
        });
      } else if (rawStatus === 'rejected') {
        await Notification.create({
          recipient: user._id,
          title: 'Developer Profile Verification Update',
          message: `Your Developer profile verification could not be approved. Reason: ${rejectionReason || 'Please check your submitted documents and re-apply.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating user notification for developer verification:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `Developer verification status updated to ${rawStatus}.`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject verification for any user (Agent, Builder, Owner, Buyer, etc.)
// @route   PATCH /api/admin/users/:id/verify-user
// @access  Private (Admin only)
exports.verifyUser = async (req, res, next) => {
  try {
    const { status, isVerified, rejectionReason, reason } = req.body;
    const finalReason = rejectionReason || reason || '';

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    const role = (user.role || '').toLowerCase();
    let targetStatus = status;

    // Handle boolean isVerified if status is not explicitly passed
    if (!targetStatus && isVerified !== undefined) {
      targetStatus = isVerified ? 'approved' : 'unverified';
    }

    if (!targetStatus || !['approved', 'rejected', 'pending', 'unverified'].includes(targetStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid status (approved, rejected, pending, unverified) or isVerified boolean is required.',
      });
    }

    const updateData = {
      isVerified: targetStatus === 'approved',
    };

    if (role === 'agent') {
      updateData.agentVerificationStatus = targetStatus;
      if (targetStatus === 'approved') {
        updateData.agentRejectionReason = undefined;
      } else if (targetStatus === 'rejected') {
        updateData.agentRejectionReason = finalReason;
      }
    } else if (role === 'builder') {
      updateData.builderVerificationStatus = targetStatus;
      if (targetStatus === 'approved') {
        updateData.builderRejectionReason = undefined;
      } else if (targetStatus === 'rejected') {
        updateData.builderRejectionReason = finalReason;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Send notification to the user
    try {
      const Notification = require('../../models/notification.model');
      if (targetStatus === 'approved') {
        await Notification.create({
          recipient: updatedUser._id,
          title: 'Account Verification Approved! 🎉',
          message: `Congratulations! Your account (${updatedUser.role || 'user'}) has been verified and approved by admin.`,
          type: 'verification',
          isRead: false,
        });
      } else if (targetStatus === 'rejected') {
        await Notification.create({
          recipient: updatedUser._id,
          title: 'Account Verification Update',
          message: `Your account verification could not be approved. Reason: ${finalReason || 'Please review your details and re-apply.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating user notification for verification:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `User verification status updated to ${targetStatus}.`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated data (cascade delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    // Cascade delete all data belonging to this user
    try {
      const Property = require('../../models/property.model');
      const Project = require('../../models/project.model');
      const Notification = require('../../models/notification.model');
      const PropertyEnquiry = require('../../models/property-enquiry.model');
      const DeveloperEnquiry = require('../../models/developer-enquiry.model');
      const TokenRequest = require('../../models/token-request.model');
      const VisitRequest = require('../../models/visit-request.model');
      const Favorite = require('../../models/favorite.model');
      const DeveloperReview = require('../../models/developer-review.model');
      const CommercialSpace = require('../../models/commercial-space.model');
      const ServiceRequest = require('../../models/service-request.model');

      // Find all properties owned by this user
      const userProperties = await Property.find({ owner: user._id }).select('_id');
      const userPropertyIds = userProperties.map(p => p._id);

      // Find all projects owned by this user
      const userProjects = await Project.find({ developer: user._id }).select('_id');
      const userProjectIds = userProjects.map(p => p._id);

      await Promise.allSettled([
        // Enquiries on user's properties OR submitted by this user
        PropertyEnquiry.deleteMany({ $or: [{ property: { $in: userPropertyIds } }, { client: user._id }] }),
        // Enquiries on user's projects OR submitted by this user
        DeveloperEnquiry.deleteMany({ $or: [{ project: { $in: userProjectIds } }, { developer: user._id }, { client: user._id }] }),
        // Token requests for user's properties OR where user is buyer or seller
        TokenRequest.deleteMany({ $or: [{ property: { $in: userPropertyIds } }, { buyer: user._id }, { seller: user._id }, { client: user._id }, { owner: user._id }] }),
        // Visit requests for user's properties OR requested by user
        VisitRequest.deleteMany({ $or: [{ property: { $in: userPropertyIds } }, { user: user._id }, { owner: user._id }] }),
        // Favorites for user's properties OR saved by user
        Favorite.deleteMany({ $or: [{ property: { $in: userPropertyIds } }, { user: user._id }] }),
        // Developer reviews
        DeveloperReview.deleteMany({ $or: [{ user: user._id }, { developer: user._id }] }),
        // Commercial spaces
        CommercialSpace.deleteMany({ owner: user._id }),
        // Service requests
        ServiceRequest.deleteMany({ user: user._id }),
        // Notifications sent to this user
        Notification.deleteMany({ recipient: user._id }),
        // User's properties
        Property.deleteMany({ owner: user._id }),
        // User's projects
        Project.deleteMany({ developer: user._id }),
      ]);
    } catch (cascadeErr) {
      console.error('Warning: Error during cascade delete for user:', cascadeErr.message);
      // Continue with user deletion even if cascade partially fails
    }

    // Finally delete the user document itself
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile by administrator
// @route   PATCH /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      status,
      isVerified,
      agentVerificationStatus,
      builderVerificationStatus,
      companyName,
      gstNumber,
      reraNumber,
      experience,
      cityOfOperation,
      address,
      latitude,
      longitude,
      intents,
      preferences,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    const updateData = {};

    if (name) updateData.name = name;
    
    // Email uniqueness check
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          status: 'fail',
          message: 'An account with this email already exists.',
        });
      }
      updateData.email = email.toLowerCase();
    }

    // Phone uniqueness check
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone !== user.phone) {
        const existingPhone = await User.findOne({ phone: normalizedPhone });
        if (existingPhone) {
          return res.status(400).json({
            status: 'fail',
            message: 'An account with this phone number already exists.',
          });
        }
        updateData.phone = normalizedPhone;
      }
    }

    if (role) {
      if (role === 'Buyer') updateData.role = 'buyer';
      else if (role === 'Seller') updateData.role = 'owner';
      else if (role === 'Agent') updateData.role = 'agent';
      else if (role === 'Builder') updateData.role = 'builder';
      else updateData.role = role.toLowerCase();
    }

    if (agentVerificationStatus) {
      updateData.agentVerificationStatus = agentVerificationStatus;
      if (agentVerificationStatus === 'approved') {
        updateData.isVerified = true;
        updateData.role = 'agent';
      }
    }

    if (builderVerificationStatus) {
      updateData.builderVerificationStatus = builderVerificationStatus;
      if (builderVerificationStatus === 'approved') {
        updateData.isVerified = true;
        updateData.role = 'builder';
      }
    }

    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
      const targetRole = updateData.role || user.role;
      if (isVerified) {
        if (targetRole === 'agent') {
          updateData.agentVerificationStatus = 'approved';
        } else if (targetRole === 'builder') {
          updateData.builderVerificationStatus = 'approved';
        }
      } else {
        if (targetRole === 'agent' && updateData.agentVerificationStatus !== 'rejected') {
          updateData.agentVerificationStatus = 'unverified';
        } else if (targetRole === 'builder' && updateData.builderVerificationStatus !== 'rejected') {
          updateData.builderVerificationStatus = 'unverified';
        }
      }
    }

    if (status) updateData.status = status;
    if (companyName) updateData.companyName = companyName;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (reraNumber) updateData.reraNumber = reraNumber;
    if (experience) updateData.experience = experience;
    if (cityOfOperation) updateData.cityOfOperation = cityOfOperation;

    if (address) {
      updateData.address = typeof address === 'string' ? { formattedAddress: address } : address;
    }

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (intents) updateData.intents = intents;
    if (preferences) updateData.preferences = preferences;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully by administrator.',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user profile by administrator
// @route   POST /api/admin/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, status, isVerified } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, Phone number, and Role are required.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if phone already registered
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this phone number already exists.',
      });
    }

    // Check if email already registered
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({
          status: 'fail',
          message: 'An account with this email address already exists.',
        });
      }
    }

    // Map UI role to DB lowercase role
    let dbRole = 'buyer';
    if (role === 'Buyer') dbRole = 'buyer';
    else if (role === 'Seller') dbRole = 'owner';
    else if (role === 'Agent') dbRole = 'agent';
    else if (role === 'Builder') dbRole = 'builder';
    else dbRole = role.toLowerCase();

    const newUser = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone: normalizedPhone,
      role: dbRole,
      status: status || 'Active',
      isVerified: !!isVerified,
      isOnboardingCompleted: true,
      companyName: req.body.companyName || name,
      gstNumber: req.body.gstNumber,
      reraNumber: req.body.reraNumber,
      yearsInBusiness: req.body.yearsInBusiness,
      cityOfOperation: req.body.cityOfOperation,
      unitsDelivered: req.body.unitsDelivered || '0',
      bio: req.body.bio,
      isIsoCertified: req.body.isIsoCertified,
      builderVerificationStatus: req.body.builderVerificationStatus || (dbRole === 'builder' ? 'approved' : 'unverified'),
    });

    res.status(201).json({
      status: 'success',
      message: 'User profile created successfully.',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enquiries sent or received by a specific user
// @route   GET /api/admin/users/:id/enquiries
// @access  Private (Admin only)
exports.getUserEnquiries = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const PropertyEnquiry = require('../../models/property-enquiry.model');
    const DeveloperEnquiry = require('../../models/developer-enquiry.model');

    // Enquiries sent by this user (buyer/client)
    const propertyEnquiriesSent = await PropertyEnquiry.find({ client: userId })
      .populate('property', 'title city locality price')
      .sort({ createdAt: -1 });

    const developerEnquiriesSent = await DeveloperEnquiry.find({ client: userId })
      .populate('developer', 'name companyName')
      .sort({ createdAt: -1 });

    // Enquiries received by this user (if they are a builder/seller/agent)
    const Property = require('../../models/property.model');
    const propertiesOwned = await Property.find({ owner: userId }).select('_id');
    const propertyIdsOwned = propertiesOwned.map(p => p._id);

    const propertyEnquiriesReceived = await PropertyEnquiry.find({ property: { $in: propertyIdsOwned } })
      .populate('property', 'title city locality price')
      .populate('client', 'name email phone')
      .sort({ createdAt: -1 });

    const developerEnquiriesReceived = await DeveloperEnquiry.find({ developer: userId })
      .populate('client', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        sent: {
          property: propertyEnquiriesSent,
          developer: developerEnquiriesSent,
        },
        received: {
          property: propertyEnquiriesReceived,
          developer: developerEnquiriesReceived,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's received property ratings & reviews
// @route   GET /api/admin/users/:id/ratings
// @access  Private (Admin only)
exports.getUserRatings = async (req, res, next) => {
  try {
    const PropertyReview = require('../../models/property-review.model');
    const reviews = await PropertyReview.find({ owner: req.params.id })
      .populate('reviewer', 'name profilePicture phone role')
      .populate('property', 'title propertyType city locality price photos submissionId')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (breakdown[star] !== undefined) breakdown[star]++;
      sumRating += Number(r.rating) || 0;
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        averageRating,
        totalReviews,
        rating: averageRating,
        reviewsCount: totalReviews,
        breakdown,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

