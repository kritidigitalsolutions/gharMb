/**
 * Admin Developer Project Controller
 * Provides moderation and review workflows for Developer / Builder Projects.
 */

const Project = require('../../models/project.model');
const User = require('../../models/user.model');
const DeveloperEnquiry = require('../../models/developer-enquiry.model');
const { resolveCoordinatesAsync } = require('../../utils/geocoder.helper');

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
        { reraNumbers: searchRegex },
        { submissionId: searchRegex },
      ];
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('developer', 'name companyName email phone reraNumber builderDocs isVerified');

    const enrichedProjects = projects.map((p) => {
      const obj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
      obj.reraNumbers = Array.isArray(obj.reraNumbers) && obj.reraNumbers.length > 0
        ? obj.reraNumbers.map((r, idx) => {
            if (typeof r === 'string') return { name: `Phase ${idx + 1}`, reraNumber: r.trim() };
            return {
              name: String(r?.name || '').trim(),
              reraNumber: String(r?.reraNumber || '').trim(),
            };
          }).filter(r => r.reraNumber)
        : (obj.reraProjectNumber ? [{ name: 'Phase 1', reraNumber: obj.reraProjectNumber.trim() }] : []);
      obj.reraNumber = obj.reraNumbers[0]?.reraNumber || obj.reraProjectNumber || '';

      if (!obj.investmentScore || !obj.investmentScore.metrics) {
        obj.investmentScore = {
          overall: Number(obj.investmentScore?.overall) || 0,
          grade: obj.investmentScore?.grade || 'Not Rated',
          totalVotes: Number(obj.investmentScore?.totalVotes) || 0,
          metrics: {
            connectivity: Number(obj.investmentScore?.metrics?.connectivity) || 0,
            rentalPotential: Number(obj.investmentScore?.metrics?.rentalPotential) || 0,
            growthPotential: Number(obj.investmentScore?.metrics?.growthPotential) || 0,
            familyLiving: Number(obj.investmentScore?.metrics?.familyLiving) || 0,
            futureDemand: Number(obj.investmentScore?.metrics?.futureDemand) || 0,
          },
        };
      }
      return obj;
    });

    res.status(200).json({
      status: 'success',
      results: enrichedProjects.length,
      data: {
        projects: enrichedProjects,
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

    let rawRera = req.body.reraNumbers !== undefined ? req.body.reraNumbers : req.body.reraProjectNumber;
    let parsedReraNumbers = [];
    if (typeof rawRera === 'string') {
      try {
        const parsed = JSON.parse(rawRera);
        if (Array.isArray(parsed)) parsedReraNumbers = parsed;
        else if (parsed && typeof parsed === 'object') parsedReraNumbers = [parsed];
        else if (parsed) parsedReraNumbers = [{ reraNumber: String(parsed) }];
      } catch {
        parsedReraNumbers = rawRera.includes(',')
          ? rawRera.split(',').map((r) => ({ reraNumber: r }))
          : [{ reraNumber: rawRera }];
      }
    } else if (Array.isArray(rawRera)) {
      parsedReraNumbers = rawRera;
    } else if (rawRera && typeof rawRera === 'object') {
      parsedReraNumbers = [rawRera];
    }

    parsedReraNumbers = parsedReraNumbers
      .map((item, idx) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed ? { name: `Phase ${idx + 1}`, reraNumber: trimmed } : null;
        }
        if (item && typeof item === 'object') {
          const num = String(item.reraNumber || item.number || item.id || '').trim();
          if (!num) return null;
          const nm = String(item.name || item.phase || item.phaseName || '').trim();
          return { name: nm, reraNumber: num };
        }
        return null;
      })
      .filter(Boolean);

    const seenRera = new Set();
    const uniqueReraNumbers = [];
    for (const r of parsedReraNumbers) {
      if (!seenRera.has(r.reraNumber)) {
        seenRera.add(r.reraNumber);
        uniqueReraNumbers.push(r);
      }
    }

    if (!projectName || uniqueReraNumbers.length === 0 || !city || !locality) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project Name, at least one RERA Registration Number, City, and Locality are required.',
      });
    }

    const effectiveReraNumber = uniqueReraNumbers[0].reraNumber;

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

    const resolvedCoords = await resolveCoordinatesAsync({
      city,
      locality,
      fullAddress,
      pincode,
      ...req.body,
    });

    const newProject = await Project.create({
      submissionId,
      projectName,
      developer: devId,
      developerName: devName || 'Registered Developer',
      reraProjectNumber: effectiveReraNumber,
      reraNumbers: parsedReraNumbers,
      city,
      locality,
      fullAddress: fullAddress || `${locality}, ${city}`,
      pincode: pincode || '122001',
      location: {
        type: 'Point',
        coordinates: resolvedCoords,
      },
      projectType: projectType || 'Residential',
      projectStatus: projectStatus || 'Under Construction',
      totalUnits: Number(totalUnits) || 0,
      possessionDate: possessionDate || 'Dec 2026',
      shortDescription: shortDescription || '',
      projectPhotos: Array.isArray(req.body.projectPhotos) ? req.body.projectPhotos : (Array.isArray(req.body.images) ? req.body.images : []),
      projectVideos: Array.isArray(req.body.projectVideos) ? req.body.projectVideos : (Array.isArray(req.body.videos) ? req.body.videos : []),
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
      totalUnits,
      projectPhotos,
      projectVideos,
      images,
      videos,
    } = req.body;

    if (projectName || title) project.projectName = projectName || title;
    if (description) project.description = description;
    if (shortDescription) project.shortDescription = shortDescription;
    if (city) project.city = city;
    if (locality !== undefined) project.locality = locality;
    if (fullAddress !== undefined) project.fullAddress = fullAddress;
    if (pincode !== undefined) project.pincode = pincode;
    if (projectType) project.projectType = projectType;
    if (projectStatus) {
      const lower = String(projectStatus).toLowerCase().trim();
      if (lower === 'ready to move') project.projectStatus = 'Ready to Move';
      else if (lower === 'new launch') project.projectStatus = 'New Launch';
      else project.projectStatus = 'Under Construction';
    }
    if (developerName) project.developerName = developerName;
    if (towers !== undefined) project.towers = Number(towers);
    if (floors !== undefined) project.floors = String(floors);
    if (totalUnits !== undefined) project.totalUnits = Number(totalUnits);
    if (projectPhotos !== undefined) project.projectPhotos = Array.isArray(projectPhotos) ? projectPhotos : [];
    else if (images !== undefined) project.projectPhotos = Array.isArray(images) ? images : [];
    if (projectVideos !== undefined) project.projectVideos = Array.isArray(projectVideos) ? projectVideos : [];
    else if (videos !== undefined) project.projectVideos = Array.isArray(videos) ? videos : [];
    if (
      req.body.longitude !== undefined ||
      req.body.latitude !== undefined ||
      req.body.lng !== undefined ||
      req.body.lat !== undefined ||
      req.body.location !== undefined ||
      city !== undefined ||
      locality !== undefined ||
      fullAddress !== undefined
    ) {
      const merged = { ...project.toObject(), ...req.body };
      const resolvedCoords = await resolveCoordinatesAsync(merged);
      project.location = {
        type: 'Point',
        coordinates: resolvedCoords,
      };
    }

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

    const investmentScore = {
      overall,
      grade,
      totalVotes,
      metrics,
      updatedAt: new Date(),
    };

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { investmentScore },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Project investment score updated successfully.',
      data: {
        investmentScore: updatedProject.investmentScore,
        project: updatedProject,
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

// @desc    Instantly toggle Sold Out status on a developer project by Admin
// @route   PATCH /api/admin/projects/:id/toggle-sold
// @access  Private (Admin only)
exports.toggleSoldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isSold, notes } = req.body;

    const project = await Project.findById(id).populate('developer', 'name companyName email phone');
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'No project found with that ID.',
      });
    }

    const targetSold = isSold !== undefined ? (isSold === true || isSold === 'true') : !project.isSold;

    project.isSold = targetSold;
    project.saleStatus = targetSold ? 'sold' : 'available';
    if (project.approvalStatus === 'approved') {
      project.isLive = true;
    }
    if (targetSold) {
      project.soldMarkedAt = new Date();
      project.soldByAdmin = req.admin?._id;
      project.saleNotes = notes || 'Project marked as Sold Out by Admin';
    } else {
      project.saleNotes = notes || 'Project relisted as Available by Admin';
    }

    await project.save();

    // Send notification to Developer
    try {
      const Notification = require('../../models/notification.model');
      if (project.developer && (project.developer._id || project.developer)) {
        await Notification.create({
          recipient: project.developer._id || project.developer,
          title: targetSold ? 'Project Marked as Sold Out 🏷️' : 'Project Relisted as Available 🏗️',
          message: targetSold
            ? `Your project "${project.projectName}" has been marked as Sold Out by admin.`
            : `Your project "${project.projectName}" has been relisted as available on GharMB.`,
          type: 'verification',
          metadata: {
            projectId: project._id,
            submissionId: project.submissionId,
            action: targetSold ? 'marked_sold' : 'relisted',
          },
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.warn('⚠️ Notification notice:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: targetSold
        ? `Project "${project.projectName}" marked as Sold Out.`
        : `Project "${project.projectName}" relisted as Available.`,
      data: {
        project,
        isSold: project.isSold,
        saleStatus: project.saleStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};




