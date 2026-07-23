/**
 * Admin User Controller
 * Allows admins to view profiles, ban/unban, and verify RERA/agent files.
 */

const User = require('../../models/user.model');

// @desc    Get all users (with filters & search)
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isVerified, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isVerified) filter.isVerified = isVerified === 'true';

    // Text search by name/email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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

// @desc    Get detailed user profile including virtual listings
// @route   GET /api/v1/admin/users/:id
// @access  Private (Admin only)
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('properties');

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

// @desc    Approve/verify agent or builder credentials
// @route   PATCH /api/v1/admin/users/:id/verify
// @access  Private (Admin only)
exports.verifyUser = async (req, res, next) => {
  try {
    const { isVerified } = req.body; // true or false

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User verification status updated to ${isVerified}.`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend/deactivate user account
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin only)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User account has been deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
