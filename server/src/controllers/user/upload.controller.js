/**
 * File Upload Controller
 * Handles single and multiple file uploads (images, PDFs, documents)
 * and connects/attaches them directly to Property or Project documents when propertyId/projectId is provided.
 */

const Property = require('../../models/property.model');
const Project = require('../../models/project.model');
const mongoose = require('mongoose');

// Helper to construct full public URL for uploaded files
const getFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// Helper to resolve target property or project
const findEntity = async (propertyId, projectId, genericId) => {
  let property = null;
  let project = null;

  const targetPropId = propertyId || (genericId && !projectId ? genericId : null);
  const targetProjId = projectId || (genericId && !propertyId ? genericId : null);

  if (targetPropId) {
    if (mongoose.Types.ObjectId.isValid(targetPropId)) {
      property = await Property.findById(targetPropId);
    }
    if (!property) {
      property = await Property.findOne({ submissionId: targetPropId });
    }
  }

  if (!property && targetProjId) {
    if (mongoose.Types.ObjectId.isValid(targetProjId)) {
      project = await Project.findById(targetProjId);
    }
    if (!project) {
      project = await Project.findOne({ submissionId: targetProjId });
    }
  }

  return { property, project };
};

// @desc    Upload a single file (image / RERA certificate / Aadhaar / PAN card / PDF brochure)
// @route   POST /api/user/upload/single
// @route   POST /api/user/upload/single/property/:propertyId
// @route   POST /api/user/upload/single/project/:projectId
// @access  Public / Private
exports.uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select a file to upload.',
      });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    const propertyId = req.params.propertyId || req.query.propertyId || req.body.propertyId;
    const projectId = req.params.projectId || req.query.projectId || req.body.projectId;
    const genericId = req.params.id || req.query.id || req.body.id;
    const field = req.query.field || req.body.field;
    const docType = req.query.docType || req.body.docType;

    const { property, project } = await findEntity(propertyId, projectId, genericId);

    // If property ID was specified but not found
    if ((propertyId || (genericId && req.query.type === 'property')) && !property) {
      return res.status(404).json({
        status: 'fail',
        message: `Property listing not found with ID: ${propertyId || genericId}`,
      });
    }

    // If project ID was specified but not found
    if ((projectId || (genericId && req.query.type === 'project')) && !project) {
      return res.status(404).json({
        status: 'fail',
        message: `Developer project not found with ID: ${projectId || genericId}`,
      });
    }

    // Attach to Property if found
    if (property) {
      const targetDocType = docType || field;
      if (targetDocType && ['titleDeed', 'electricityBill', 'taxReceipt', 'khataExtract', 'otherDoc'].includes(targetDocType)) {
        if (!property.propertyDocuments) property.propertyDocuments = {};
        property.propertyDocuments[targetDocType] = fileUrl;
        property.documents = property.documents || [];
        property.documents.push({
          name: req.file.originalname,
          url: fileUrl,
          docType: targetDocType,
        });
      } else {
        property.images = property.images || [];
        if (!property.images.includes(fileUrl)) {
          property.images.push(fileUrl);
        }
      }
      await property.save();
    }

    // Attach to Project if found
    if (project) {
      const targetField = field || docType;
      if (targetField === 'masterPlan') {
        project.masterPlanUrl = fileUrl;
      } else if (targetField === 'floorPlan') {
        project.floorPlanUrl = fileUrl;
      } else if (targetField === 'brochure') {
        project.brochureUrl = fileUrl;
      } else {
        project.projectPhotos = project.projectPhotos || [];
        if (!project.projectPhotos.includes(fileUrl)) {
          project.projectPhotos.push(fileUrl);
        }
      }
      await project.save();
    }

    res.status(200).json({
      status: 'success',
      message: property || project
        ? `File uploaded and attached to ${property ? 'Property' : 'Project'} successfully.`
        : 'File uploaded successfully.',
      data: {
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        property: property || undefined,
        project: project || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple files (up to 12 photos/documents)
// @route   POST /api/user/upload/multiple
// @route   POST /api/user/upload/multiple/property/:propertyId
// @route   POST /api/user/upload/multiple/project/:projectId
// @access  Public / Private
exports.uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select at least one file to upload.',
      });
    }

    const fileUrls = req.files.map((file) => getFileUrl(req, file.filename));
    const propertyId = req.params.propertyId || req.query.propertyId || req.body.propertyId;
    const projectId = req.params.projectId || req.query.projectId || req.body.projectId;
    const genericId = req.params.id || req.query.id || req.body.id;

    const { property, project } = await findEntity(propertyId, projectId, genericId);

    // If property ID was explicitly specified but not found
    if ((propertyId || (genericId && req.query.type === 'property')) && !property) {
      return res.status(404).json({
        status: 'fail',
        message: `Property listing not found with ID: ${propertyId || genericId}`,
      });
    }

    // If project ID was explicitly specified but not found
    if ((projectId || (genericId && req.query.type === 'project')) && !project) {
      return res.status(404).json({
        status: 'fail',
        message: `Developer project not found with ID: ${projectId || genericId}`,
      });
    }

    // Attach images to Property
    if (property) {
      property.images = property.images || [];
      fileUrls.forEach((url) => {
        if (!property.images.includes(url)) {
          property.images.push(url);
        }
      });
      await property.save();
    }

    // Attach photos to Project
    if (project) {
      project.projectPhotos = project.projectPhotos || [];
      fileUrls.forEach((url) => {
        if (!project.projectPhotos.includes(url)) {
          project.projectPhotos.push(url);
        }
      });
      await project.save();
    }

    res.status(200).json({
      status: 'success',
      message: property || project
        ? `${req.files.length} files uploaded and attached to ${property ? 'Property' : 'Project'} successfully.`
        : `${req.files.length} files uploaded successfully.`,
      data: {
        fileUrls,
        count: req.files.length,
        property: property || undefined,
        project: project || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
