/**
 * App Developer Project Controller
 * Provides 5-step project submission for builders, my-projects list, and public explore projects feed.
 */

const Project = require('../../models/project.model');

// @desc    Retrieve approved live developer projects (with city, status, type filters)
// @route   GET /api/user/projects
// @access  Public
exports.getAllProjects = async (req, res, next) => {
  try {
    const { city, projectType, projectStatus, search } = req.query;

    const filter = { approvalStatus: 'approved', isLive: true };

    if (req.query.saleStatus) {
      filter.saleStatus = req.query.saleStatus;
    } else if (req.query.includeSold !== 'true' && req.query.showSold !== 'true') {
      filter.isSold = { $ne: true };
    }

    if (city) filter.city = new RegExp(city, 'i');
    if (projectType) filter.projectType = projectType;
    if (projectStatus) filter.projectStatus = projectStatus;

    if (search) {
      filter.$text = { $search: search };
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('developer', 'name companyName phone profilePicture builderDocs isVerified');

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

// @desc    Get detailed project view (increments view count, includes investmentScore)
// @route   GET /api/user/projects/:id
// @access  Public
exports.getProjectDetails = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('developer', 'name companyName email phone profilePicture builderDocs isVerified');

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer project not found.',
      });
    }

    // Increment views only for approved live projects
    if (project.approvalStatus === 'approved' && project.isLive) {
      await Project.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    }

    // Ensure investmentScore object is populated with metrics defaults
    if (!project.investmentScore || !project.investmentScore.metrics) {
      project.investmentScore = {
        overall: 0,
        grade: 'Not Rated',
        metrics: {
          connectivity: 0,
          rentalPotential: 0,
          growthPotential: 0,
          familyLiving: 0,
          futureDemand: 0,
        },
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new 5-Step Developer Project for Admin Review
// @route   POST /api/user/projects
// @access  Private (Builder/Developer)
exports.createProject = async (req, res, next) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toLowerCase();

    // 1. Developer Verification Guard: Developer must be verified & approved by Admin before uploading projects
    if (userRole !== 'builder' || user.builderVerificationStatus !== 'approved') {
      if (user.builderVerificationStatus === 'rejected') {
        return res.status(403).json({
          status: 'fail',
          message: `Your Developer profile verification was rejected by admin: ${user.builderRejectionReason || 'Please review and re-upload your company documents.'}`,
        });
      }
      return res.status(403).json({
        status: 'fail',
        message: 'Your Developer profile and company documents are currently under admin review. You can upload projects once admin verifies and approves your account.',
      });
    }

    const projectData = {
      ...req.body,
      developer: user._id,
      developerName: req.body.developerName || user.companyName || user.name,
      approvalStatus: 'pending',
      isLive: false,
    };

    // ── 🛡️ MEDIA EXTRACTION & SEPARATION (Photos & Short Videos) ──────────────
    const isProjectVideo = (url) => {
      if (!url || typeof url !== 'string') return false;
      try {
        const decoded = decodeURIComponent(url).toLowerCase();
        const cleanPath = decoded.split('?')[0];
        return (
          /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(cleanPath) ||
          decoded.includes('/video/') ||
          decoded.includes('/videos/') ||
          decoded.includes('video/mp4') ||
          decoded.includes('format=mp4') ||
          decoded.includes('contenttype=video')
        );
      } catch (_) {
        return /\.(mp4|webm|mov|m4v|mkv|avi|3gp)/i.test(url) || url.toLowerCase().includes('video');
      }
    };

    let rawMedia = [];
    if (Array.isArray(req.body.projectPhotos)) rawMedia.push(...req.body.projectPhotos);
    if (Array.isArray(req.body.photos)) rawMedia.push(...req.body.photos);
    if (Array.isArray(req.body.images)) rawMedia.push(...req.body.images);
    if (Array.isArray(req.body.projectVideos)) rawMedia.push(...req.body.projectVideos);
    if (Array.isArray(req.body.videos)) rawMedia.push(...req.body.videos);
    if (typeof req.body.video === 'string' && req.body.video) rawMedia.push(req.body.video);
    if (typeof req.body.videoUrl === 'string' && req.body.videoUrl) rawMedia.push(req.body.videoUrl);

    const extractedPhotos = [];
    const extractedVideos = [];

    for (const item of rawMedia) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const trimmed = item.trim();
      if (isProjectVideo(trimmed)) {
        if (!extractedVideos.includes(trimmed)) extractedVideos.push(trimmed);
      } else {
        if (!extractedPhotos.includes(trimmed)) extractedPhotos.push(trimmed);
      }
    }

    if (extractedPhotos.length > 0 || extractedVideos.length > 0) {
      projectData.projectPhotos = extractedPhotos;
      projectData.projectVideos = extractedVideos;
    }

    // GeoJSON Location coordinates
    if (req.body.longitude && req.body.latitude) {
      projectData.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    const project = await Project.create(projectData);

    // Notify all admins about the new project submission
    try {
      const Admin = require('../../models/admin.model');
      const Notification = require('../../models/notification.model');
      const admins = await Admin.find().select('_id');
      if (admins.length > 0) {
        const notificationsData = admins.map((admin) => ({
          recipient: admin._id,
          title: 'New Developer Project Pending Verification',
          message: `Developer ${user.companyName || user.name} has submitted a new project "${project.projectName}" (${project.city}) for review.`,
          type: 'verification',
          isRead: false,
        }));
        await Notification.insertMany(notificationsData);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for project creation:', notifErr);
    }

    res.status(201).json({
      status: 'success',
      message: 'Developer project submitted successfully! Admin will verify and approve before it goes live.',
      data: {
        submissionId: project.submissionId,
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects uploaded by logged-in developer
// @route   GET /api/user/projects/my-projects
// @access  Private
exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ developer: req.user._id }).sort({ createdAt: -1 });

    const totalProjects = projects.length;
    const liveProjects = projects.filter((p) => p.approvalStatus === 'approved' && p.isLive);
    const pendingProjects = projects.filter((p) => p.approvalStatus === 'pending');
    const rejectedProjects = projects.filter((p) => p.approvalStatus === 'rejected');

    res.status(200).json({
      status: 'success',
      data: {
        counters: {
          totalProjects,
          liveProjects: liveProjects.length,
          pendingProjects: pendingProjects.length,
          rejectedProjects: rejectedProjects.length,
        },
        myProjects: {
          live: liveProjects,
          pending: pendingProjects,
          rejected: rejectedProjects,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned developer project
// @route   PUT /api/user/projects/:id
// @access  Private (Developer who owns the project)
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer project not found.',
      });
    }

    const isAdmin = ['admin', 'superadmin', 'super_admin'].includes((req.user?.role || '').toLowerCase());
    if (!isAdmin && project.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this project listing.',
      });
    }

    const updateFields = { ...req.body };
    if (!isAdmin) {
      updateFields.approvalStatus = 'pending';
      updateFields.isLive = false;
    }

    project = await Project.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Developer project updated and re-submitted for admin review.',
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete owned developer project
// @route   DELETE /api/user/projects/:id
// @access  Private (Developer who owns the project)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer project not found.',
      });
    }

    if (project.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this project listing.',
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Developer project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

