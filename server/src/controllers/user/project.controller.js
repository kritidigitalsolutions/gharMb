/**
 * App Developer Project Controller
 * Provides 5-step project submission for builders, my-projects list, and public explore projects feed.
 */

const Project = require('../../models/project.model');
const {
  calculateDistanceInKm,
  formatDistanceText,
  resolveCoordinatesAsync,
} = require('../../utils/geocoder.helper');

// @desc    Retrieve approved live developer projects (with city, status, type filters, and nearest-first geospatial sorting)
// @route   GET /api/user/projects
// @access  Public
exports.getAllProjects = async (req, res, next) => {
  try {
    const {
      city,
      projectType,
      projectStatus,
      search,
      lat,
      lng,
      latitude,
      longitude,
      radius,
      distanceInKm,
      radiusUnit = 'km',
    } = req.query;

    const filter = { approvalStatus: 'approved', isLive: true };

    if (req.query.saleStatus) {
      filter.saleStatus = req.query.saleStatus;
    } else if (req.query.includeSold !== 'true' && req.query.showSold !== 'true') {
      filter.isSold = { $ne: true };
    }

    const hasValidCity = city && city !== 'null' && city !== 'undefined' && city.trim() !== '';
    const cleanCity = hasValidCity ? city.split(',')[0].trim() : null;

    if (cleanCity) filter.city = new RegExp(cleanCity, 'i');
    if (projectType) filter.projectType = projectType;
    if (projectStatus) filter.projectStatus = projectStatus;

    if (search) {
      filter.$text = { $search: search };
    }

    const targetLat = lat || latitude;
    const targetLng = lng || longitude || req.query.long;
    const isGeospatial =
      targetLat !== undefined &&
      targetLng !== undefined &&
      !isNaN(Number(targetLat)) &&
      !isNaN(Number(targetLng));

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('developer', 'name companyName phone profilePicture builderDocs isVerified');

    let enrichedProjects = projects.map((p) => {
      const obj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
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

      let distKm = null;
      if (
        isGeospatial &&
        obj.location &&
        Array.isArray(obj.location.coordinates) &&
        obj.location.coordinates.length >= 2
      ) {
        const pLng = obj.location.coordinates[0];
        const pLat = obj.location.coordinates[1];
        distKm = calculateDistanceInKm(Number(targetLat), Number(targetLng), pLat, pLng);
      }

      obj.distanceInKm = distKm;
      obj.distanceMeters = distKm !== null ? Math.round(distKm * 1000) : null;
      obj.distance = distKm !== null ? `${distKm} km` : null;
      obj.distanceText = formatDistanceText(distKm);

      return obj;
    });

    if (isGeospatial) {
      // Sort nearest-first
      enrichedProjects.sort((a, b) => {
        if (a.distanceInKm === null) return 1;
        if (b.distanceInKm === null) return -1;
        return a.distanceInKm - b.distanceInKm;
      });

      // Filter by radius if provided
      const rawRadius = radius ?? distanceInKm;
      if (rawRadius) {
        const parsedRadius = parseFloat(rawRadius);
        if (!isNaN(parsedRadius) && parsedRadius > 0) {
          const unit = (radiusUnit || '').toLowerCase().trim();
          const maxDistanceKm = unit === 'miles' || unit === 'mi' ? parsedRadius * 1.60934 : parsedRadius;
          const withinRadius = enrichedProjects.filter(
            (p) => p.distanceInKm !== null && p.distanceInKm <= maxDistanceKm
          );
          if (withinRadius.length > 0) {
            enrichedProjects = withinRadius;
          }
        }
      }
    }

    res.status(200).json({
      status: 'success',
      results: enrichedProjects.length,
      userLocation: isGeospatial ? { latitude: Number(targetLat), longitude: Number(targetLng) } : null,
      isLocationSorted: isGeospatial,
      data: {
        projects: enrichedProjects,
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

    // ── 🛡️ MULTIPLE RERA NUMBERS HANDLING ─────────────────────────────────────
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

    if (uniqueReraNumbers.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one RERA registration number is mandatory for Developer Projects.',
      });
    }

    // ── 🛡️ 3 CANONICAL PROJECT STATUS OPTIONS: Under Construction, Ready to Move, New Launch
    let normalizedProjectStatus = 'Under Construction';
    if (req.body.projectStatus) {
      const lowerStatus = String(req.body.projectStatus).toLowerCase().trim();
      if (lowerStatus === 'ready to move') normalizedProjectStatus = 'Ready to Move';
      else if (lowerStatus === 'new launch') normalizedProjectStatus = 'New Launch';
      else normalizedProjectStatus = 'Under Construction';
    }

    const projectData = {
      ...req.body,
      projectStatus: normalizedProjectStatus,
      developer: user._id,
      developerName: req.body.developerName || user.companyName || user.name,
      reraNumbers: uniqueReraNumbers,
      reraProjectNumber: uniqueReraNumbers[0].reraNumber,
      approvalStatus: 'pending',
      isLive: false,
    };

    // ── 🛡️ DEVELOPER RULE: Ownership type is not applicable for developer projects
    delete projectData.ownershipType;
    delete projectData.ownership;
    delete projectData.listingAs;

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

    // GeoJSON Location coordinates (exact GPS or high-precision geocoded fallback)
    const resolvedCoords = await resolveCoordinatesAsync({
      city: projectData.city,
      locality: projectData.locality,
      fullAddress: projectData.fullAddress,
      pincode: projectData.pincode,
      ...req.body,
    });
    projectData.location = {
      type: 'Point',
      coordinates: resolvedCoords,
    };

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
    if (updateFields.reraNumbers !== undefined || updateFields.reraProjectNumber !== undefined) {
      let rawRera = updateFields.reraNumbers !== undefined ? updateFields.reraNumbers : updateFields.reraProjectNumber;
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

      if (uniqueReraNumbers.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'At least one RERA registration number is mandatory for Developer Projects.',
        });
      }
      updateFields.reraNumbers = uniqueReraNumbers;
      updateFields.reraProjectNumber = uniqueReraNumbers[0].reraNumber;
    }
    if (!isAdmin) {
      updateFields.approvalStatus = 'pending';
      updateFields.isLive = false;
    }

    if (
      updateFields.longitude !== undefined ||
      updateFields.latitude !== undefined ||
      updateFields.lng !== undefined ||
      updateFields.lat !== undefined ||
      updateFields.location !== undefined ||
      updateFields.city !== undefined ||
      updateFields.locality !== undefined ||
      updateFields.fullAddress !== undefined
    ) {
      const merged = { ...project.toObject(), ...updateFields };
      const resolvedCoords = await resolveCoordinatesAsync(merged);
      updateFields.location = {
        type: 'Point',
        coordinates: resolvedCoords,
      };
      delete updateFields.longitude;
      delete updateFields.latitude;
      delete updateFields.lng;
      delete updateFields.lat;
    }

    if (updateFields.projectStatus) {
      const lowerStatus = String(updateFields.projectStatus).toLowerCase().trim();
      if (lowerStatus === 'ready to move') updateFields.projectStatus = 'Ready to Move';
      else if (lowerStatus === 'new launch') updateFields.projectStatus = 'New Launch';
      else updateFields.projectStatus = 'Under Construction';
    }

    delete updateFields.ownershipType;
    delete updateFields.ownership;
    delete updateFields.listingAs;

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

