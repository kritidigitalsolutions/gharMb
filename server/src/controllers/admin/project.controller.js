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
      filter.$text = { $search: search };
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('developer', 'name companyName email phone reraNumber builderDocs');

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
    const { approvalStatus, rejectionReason } = req.body;

    if (!approvalStatus || !['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid approvalStatus (approved, rejected, pending) is required.',
      });
    }

    const updateData = {
      approvalStatus,
      isLive: approvalStatus === 'approved',
    };

    if (approvalStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (approvalStatus === 'approved') {
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

    res.status(200).json({
      status: 'success',
      message: `Developer project approval status updated to ${approvalStatus}.`,
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
