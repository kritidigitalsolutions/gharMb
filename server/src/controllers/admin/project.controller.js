/**
 * Admin Developer Project Controller
 * Provides moderation and review workflows for Developer / Builder Projects.
 */

const Project = require('../../models/project.model');

// @desc    Get all developer projects (with filters for status, projectType, approvalStatus)
// @route   GET /api/admin/projects
// @access  Private (Admin only)
exports.getAllProjects = async (req, res, next) => {
  try {
    const { approvalStatus, projectType, city, search } = req.query;
    const filter = {};

    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (projectType) filter.projectType = projectType;
    if (city) filter.city = new RegExp(city, 'i');

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { projectName: searchRegex },
        { developerName: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { reraProjectNumber: searchRegex },
        { submissionId: searchRegex },
      ];
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('developer', 'name companyName email phone reraNumber builderDocs isVerified');

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and update developer project approval status (approve / reject)
// @route   PATCH /api/admin/projects/:id/status
// @access  Private (Admin only)
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const rawStatus = req.body.approvalStatus || req.body.status;
    const rejectionReason = req.body.rejectionReason || req.body.rejectReason;

    if (!rawStatus || !['approved', 'rejected', 'pending'].includes(rawStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid approvalStatus or status (approved, rejected, pending) is required.',
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

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('developer', 'name companyName email phone');

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    // Send notification to the Developer
    try {
      const Notification = require('../../models/notification.model');
      if (rawStatus === 'approved') {
        await Notification.create({
          recipient: project.developer._id,
          title: 'Project Listing Approved & Live! 🏗️',
          message: `Your project listing "${project.projectName}" (${project.submissionId || ''}) has been verified and approved by admin. It is now live in the project directory.`,
          type: 'verification',
          isRead: false,
        });
      } else if (rawStatus === 'rejected') {
        await Notification.create({
          recipient: project.developer._id,
          title: 'Project Listing Review Update',
          message: `Your project listing "${project.projectName}" was not approved. Reason: ${rejectionReason || 'Please review project details/documents and re-submit.'}`,
          type: 'verification',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating user notification for project moderation:', notifErr);
    }

    res.status(200).json({
      status: 'success',
      message: `Developer project approval status updated to ${rawStatus}.`,
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete developer project from platform
// @route   DELETE /api/admin/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Developer project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
