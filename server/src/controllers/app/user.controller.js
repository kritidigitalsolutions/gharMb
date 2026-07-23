/**
 * App User Controller
 * Manages user profile retrievals, profile edits, and verification uploads.
 */

const User = require('../../models/user.model');

// @desc    Get current user profile
// @route   GET /api/v1/app/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PATCH /api/v1/app/users/update-me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload documents for account verification (RERA/ID Proof)
// @route   POST /api/v1/app/users/upload-documents
// @access  Private (Owner/Agent/Builder only)
exports.uploadVerificationDocs = async (req, res, next) => {
  try {
    const { docType, fileUrl } = req.body;

    if (!docType || !fileUrl) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide docType and fileUrl.',
      });
    }

    const user = await User.findById(req.user._id);

    // Push new document to profile list
    user.verificationDocuments.push({
      docType,
      fileUrl,
    });

    // Update status to verify in-progress
    user.isVerified = false; // reset/retain as false until admin reviews

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Verification document uploaded successfully. Waiting for admin approval.',
      data: {
        documents: user.verificationDocuments,
      },
    });
  } catch (error) {
    next(error);
  }
};
