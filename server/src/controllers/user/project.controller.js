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

// @desc    Get detailed project view (increments view count)
// @route   GET /api/user/projects/:id
// @access  Public
exports.getProjectDetails = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('developer', 'name companyName email phone profilePicture builderDocs isVerified');

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer project not found.',
      });
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
    const projectData = {
      ...req.body,
      developer: req.user._id,
      approvalStatus: 'pending',
      isLive: false,
    };

    // GeoJSON Location coordinates
    if (req.body.longitude && req.body.latitude) {
      projectData.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    const project = await Project.create(projectData);

    res.status(201).json({
      status: 'success',
      message: 'Developer project submitted for admin verification.',
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

    if (project.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not own this project listing.',
      });
    }

    const updateFields = { ...req.body };
    updateFields.approvalStatus = 'pending';
    updateFields.isLive = false;

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
