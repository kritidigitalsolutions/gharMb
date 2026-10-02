/**
 * Admin Commercial Space Controller
 * Provides listing review, approval/rejection, featuring, deletion, and paginated queries for administrators.
 */

const CommercialSpace = require('../../models/commercial-space.model');

// @desc    Get all commercial spaces with optional filters and pagination
// @route   GET /api/admin/commercial-spaces
// @access  Private (Admin only)
exports.getAllSpaces = async (req, res, next) => {
  try {
    const {
      spaceType,
      listingFor,
      approvalStatus,
      search,
      owner,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (spaceType)      filter.spaceType      = spaceType;
    if (listingFor)     filter.listingFor     = listingFor;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (owner)          filter.owner          = owner;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title:        searchRegex },
        { city:         searchRegex },
        { locality:     searchRegex },
        { submissionId: searchRegex },
        { spaceType:    searchRegex },
        { listingAs:    searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [spaces, total] = await Promise.all([
      CommercialSpace.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name email phone role isVerified companyName'),
      CommercialSpace.countDocuments(filter),
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

// @desc    Approve or reject a commercial space listing
// @route   PATCH /api/admin/commercial-spaces/:id/status
// @access  Private (Admin only)
exports.updateSpaceStatus = async (req, res, next) => {
  try {
    const rawStatus      = req.body.approvalStatus || req.body.status;
    const rejectionReason = req.body.rejectionReason || req.body.rejectReason;

    if (!rawStatus || !['approved', 'rejected', 'pending'].includes(rawStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid approvalStatus (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      approvalStatus: rawStatus,
      isLive: rawStatus === 'approved',
    };

    if (rawStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (rawStatus === 'approved') {
      updateData.rejectionReason = undefined;
    }

    const space = await CommercialSpace.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email phone');

    if (!space) {
      return res.status(404).json({
        status: 'fail',
        message: 'No commercial space found with that ID.',
      });
    }

    // Notify the listing owner
    try {
      const Notification = require('../../models/notification.model');
      if (rawStatus === 'approved') {
        await Notification.create({
          recipient: space.owner._id,
          title: 'Commercial Space Listing Approved & Live! 🏢',
          message: `Your commercial listing "${space.title}" (${space.submissionId || ''}) has been approved and is now live.`,
          type: 'verification',
          isRead: false,
        });
      } else if (rawStatus === 'rejected') {
        await Notification.create({
          recipient: space.owner._id,
          title: 'Commercial Space Listing Review Update',
          message: `Your commercial listing "${space.title}" was not approved. Reason: ${rejectionReason || 'Please review details and re-submit.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error sending notification for commercial space moderation:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `Commercial space approval status updated to "${rawStatus}".`,
      data: { space },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle featured / listing tier for a commercial space
// @route   PATCH /api/admin/commercial-spaces/:id/featured
// @access  Private (Admin only)
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { listingTier } = req.body;

    const space = await CommercialSpace.findByIdAndUpdate(
      req.params.id,
      { listingTier: listingTier || 'Featured' },
      { new: true }
    );

    if (!space) {
      return res.status(404).json({
        status: 'fail',
        message: 'No commercial space found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Commercial space listing tier updated to "${space.listingTier}".`,
      data: { space },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a commercial space listing
// @route   DELETE /api/admin/commercial-spaces/:id
// @access  Private (Admin only)
exports.deleteSpace = async (req, res, next) => {
  try {
    const space = await CommercialSpace.findByIdAndDelete(req.params.id);

    if (!space) {
      return res.status(404).json({
        status: 'fail',
        message: 'No commercial space found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Commercial space listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
