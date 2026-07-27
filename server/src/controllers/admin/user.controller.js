/**
 * Admin User Controller
 * Allows admins to view profiles, verify RERA Agent documents, verify Developer company documents, and manage users.
 */

const User = require('../../models/user.model');

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
