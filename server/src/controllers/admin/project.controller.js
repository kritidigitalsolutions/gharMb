/**
 * Admin Developer Project Controller
 * Provides moderation and review workflows for Developer / Builder Projects.
 */

const Project = require('../../models/project.model');
const User = require('../../models/user.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');

// @desc    Get all developer projects (with filters for status, projectType, approvalStatus)
// @route   GET /api/admin/projects
// @access  Private (Admin only)
exports.getAllProjects = async (req, res, next) => {
  try {
    const { approvalStatus, projectType, city, search } = req.query;
    const filter = {};

    // Ensure projects belong to existing users
    const validUserIds = await User.distinct('_id');
    filter.developer = { $in: validUserIds };

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
// @desc    Create a new developer project listing by administrator
// @route   POST /api/admin/projects
// @access  Private (Admin only)
exports.createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      developer,
      developerName,
      reraProjectNumber,
      city,
      locality,
      fullAddress,
      pincode,
      projectType,
      projectStatus,
      totalUnits,
      possessionDate,
      shortDescription,
      approvalStatus,
    } = req.body;

    if (!projectName || !reraProjectNumber || !city || !locality) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project Name, RERA Number, City, and Locality are required.',
      });
    }

    const submissionId = `PRJ-${Date.now().toString().slice(-6)}`;

    let devId = developer;
    let devName = developerName;
    const User = require('../../models/user.model');

    if (devId) {
      const devUser = await User.findById(devId);
      if (devUser) {
        devName = devUser.companyName || devUser.name;
      }
    } else {
      const anyBuilder = await User.findOne({ role: 'builder' });
      if (anyBuilder) {
        devId = anyBuilder._id;
        devName = devName || anyBuilder.companyName || anyBuilder.name;
      }
    }

    const newProject = await Project.create({
      submissionId,
      projectName,
      developer: devId,
      developerName: devName || 'Registered Developer',
      reraProjectNumber,
      city,
      locality,
      fullAddress: fullAddress || `${locality}, ${city}`,
      pincode: pincode || '122001',
      projectType: projectType || 'Residential',
      projectStatus: projectStatus || 'Under construction',
      totalUnits: Number(totalUnits) || 0,
      possessionDate: possessionDate || 'Dec 2026',
      shortDescription: shortDescription || '',
      approvalStatus: approvalStatus || 'approved',
      isLive: approvalStatus !== 'rejected' && approvalStatus !== 'pending',
    });

    res.status(201).json({
      status: 'success',
      message: 'Developer project created successfully.',
      data: {
        project: newProject,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update developer project details by Admin
// @route   PUT /api/admin/projects/:id OR PATCH /api/admin/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    const {
      title,
      projectName,
      description,
      shortDescription,
      city,
      locality,
      fullAddress,
      pincode,
      projectType,
      projectStatus,
      price,
      developerName,
      towers,
      floors,
      totalUnits
    } = req.body;

    if (projectName || title) project.projectName = projectName || title;
    if (description) project.description = description;
    if (shortDescription) project.shortDescription = shortDescription;
    if (city) project.city = city;
    if (locality !== undefined) project.locality = locality;
    if (fullAddress !== undefined) project.fullAddress = fullAddress;
    if (pincode !== undefined) project.pincode = pincode;
    if (projectType) project.projectType = projectType;
    if (projectStatus) project.projectStatus = projectStatus;
    if (developerName) project.developerName = developerName;
    if (towers !== undefined) project.towers = Number(towers);
    if (floors !== undefined) project.floors = String(floors);
    if (totalUnits !== undefined) project.totalUnits = Number(totalUnits);

    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Developer project updated successfully.',
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

    await DeveloperEnquiry.deleteMany({ project: project._id });

    res.status(200).json({
      status: 'success',
      message: 'Developer project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project investment score (Admin Baseline / Override)
// @route   PUT /api/admin/projects/:id/investment-score
// @access  Private (Admin only)
exports.updateInvestmentScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    const connectivity = Number(req.body.connectivity ?? req.body.metrics?.connectivity);
    const rentalPotential = Number(req.body.rentalPotential ?? req.body.metrics?.rentalPotential);
    const growthPotential = Number(req.body.growthPotential ?? req.body.metrics?.growthPotential);
    const familyLiving = Number(req.body.familyLiving ?? req.body.metrics?.familyLiving);
    const futureDemand = Number(req.body.futureDemand ?? req.body.metrics?.futureDemand);

    if (
      isNaN(connectivity) ||
      isNaN(rentalPotential) ||
      isNaN(growthPotential) ||
      isNaN(familyLiving) ||
      isNaN(futureDemand)
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'All 5 metrics (connectivity, rentalPotential, growthPotential, familyLiving, futureDemand) are required numbers between 0 and 10.',
      });
    }

    const metricsList = [connectivity, rentalPotential, growthPotential, familyLiving, futureDemand];
    if (metricsList.some((val) => val < 0 || val > 10)) {
      return res.status(400).json({
        status: 'fail',
        message: 'All metric scores must be between 0 and 10.',
      });
    }

    const {
      roundToOneDecimal,
      calculateGrade,
      calculateOverallFromMetrics,
    } = require('../../utils/investmentScore.helper');

    const metrics = {
      connectivity: roundToOneDecimal(connectivity),
      rentalPotential: roundToOneDecimal(rentalPotential),
      growthPotential: roundToOneDecimal(growthPotential),
      familyLiving: roundToOneDecimal(familyLiving),
      futureDemand: roundToOneDecimal(futureDemand),
    };

    const overall = req.body.overall !== undefined
      ? roundToOneDecimal(Number(req.body.overall))
      : calculateOverallFromMetrics(metrics);

    const grade = req.body.grade || calculateGrade(overall);

    const totalVotes = req.body.totalVotes !== undefined
      ? Number(req.body.totalVotes)
      : (project.investmentScore?.totalVotes || 0);

    project.investmentScore = {
      overall,
      grade,
      totalVotes,
      metrics,
    };

    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Project investment score updated successfully.',
      data: {
        investmentScore: project.investmentScore,
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project investment score
// @route   GET /api/admin/projects/:id/investment-score
// @access  Private (Admin only)
exports.getInvestmentScore = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('projectName investmentScore developer developerName city locality');

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        investmentScore: project.investmentScore,
        projectName: project.projectName,
      },
    });
  } catch (error) {
    next(error);
  }
};



