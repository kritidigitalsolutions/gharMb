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
    const { role, isVerified, agentVerificationStatus, builderVerificationStatus, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isVerified) filter.isVerified = isVerified === 'true';
    if (agentVerificationStatus) filter.agentVerificationStatus = agentVerificationStatus;
    if (builderVerificationStatus) filter.builderVerificationStatus = builderVerificationStatus;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
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
      role: 'agent',
      agentVerificationStatus: 'pending',
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
    const { agentVerificationStatus, rejectionReason } = req.body;

    if (!agentVerificationStatus || !['approved', 'rejected', 'pending'].includes(agentVerificationStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid agentVerificationStatus (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      agentVerificationStatus,
      isVerified: agentVerificationStatus === 'approved',
    };

    if (agentVerificationStatus === 'rejected' && rejectionReason) {
      updateData.agentRejectionReason = rejectionReason;
    } else if (agentVerificationStatus === 'approved') {
      updateData.agentRejectionReason = undefined;
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

    res.status(200).json({
      status: 'success',
      message: `Agent verification status updated to ${agentVerificationStatus}.`,
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
    const { builderVerificationStatus, rejectionReason } = req.body;

    if (!builderVerificationStatus || !['approved', 'rejected', 'pending'].includes(builderVerificationStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid builderVerificationStatus (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      builderVerificationStatus,
      isVerified: builderVerificationStatus === 'approved',
    };

    if (builderVerificationStatus === 'rejected' && rejectionReason) {
      updateData.builderRejectionReason = rejectionReason;
    } else if (builderVerificationStatus === 'approved') {
      updateData.builderRejectionReason = undefined;
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

    res.status(200).json({
      status: 'success',
      message: `Developer verification status updated to ${builderVerificationStatus}.`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User account has been deleted successfully.',
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
      isVerified,
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

    if (role) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
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
