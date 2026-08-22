/**
 * File Upload Controller
 * Dedicated endpoints for uploading multiple images, photos, and PDF documents
 * directly to a Property or Developer Project via their :id param.
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

// Helper to find Property by _id or submissionId
const findPropertyById = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const prop = await Property.findById(id);
    if (prop) return prop;
  }
  return await Property.findOne({ submissionId: id });
};

// Helper to find Project by _id or submissionId
const findProjectById = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const proj = await Project.findById(id);
    if (proj) return proj;
  }
  return await Project.findOne({ submissionId: id });
};

/**
 * @desc    Upload multiple images & documents for a Property by ID
 * @route   POST /api/user/upload/property/:id
 * @route   PATCH /api/user/upload/property/:id
 * @access  Private / Public
 */
exports.uploadPropertyFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find Property
    const property = await findPropertyById(id);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: `Property listing not found with ID: ${id}`,
      });
    }

    // 2. Validate uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide at least one file to upload (form-data fields: images, photos, titleDeed, electricityBill, taxReceipt, khataExtract, etc.).',
      });
    }

    const shouldReplaceImages = req.query.replace === 'true' || req.body.replace === 'true';
    if (shouldReplaceImages) {
      property.images = [];
    } else {
      property.images = property.images || [];
    }

    if (!property.propertyDocuments) {
      property.propertyDocuments = {};
    }
    property.documents = property.documents || [];

    const uploadedFilesMeta = [];

    // 3. Process each uploaded file and save to Property schema
    for (const file of req.files) {
      const fileUrl = getFileUrl(req, file.filename);
      const fieldname = (file.fieldname || '').toLowerCase();
      const isPdfOrDoc =
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('msword') ||
        file.mimetype.includes('document') ||
        file.originalname.toLowerCase().endsWith('.pdf') ||
        file.originalname.toLowerCase().endsWith('.docx');

      uploadedFilesMeta.push({
        fieldname: file.fieldname,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl,
      });

      // Specific Legal Document Fields
      if (fieldname.includes('titledeed') || fieldname === 'title_deed') {
        property.propertyDocuments.titleDeed = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: 'titleDeed' });
      } else if (fieldname.includes('electricitybill') || fieldname === 'electricity_bill' || fieldname === 'electricbill') {
        property.propertyDocuments.electricityBill = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: 'electricityBill' });
      } else if (fieldname.includes('taxreceipt') || fieldname === 'tax_receipt') {
        property.propertyDocuments.taxReceipt = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: 'taxReceipt' });
      } else if (fieldname.includes('khata') || fieldname.includes('khataextract')) {
        property.propertyDocuments.khataExtract = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: 'khataExtract' });
      } else if (fieldname.includes('otherdoc') || fieldname === 'other_doc' || fieldname === 'document' || fieldname === 'doc') {
        property.propertyDocuments.otherDoc = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: 'otherDoc' });
      } else if (isPdfOrDoc) {
        property.propertyDocuments.otherDoc = fileUrl;
        property.documents.push({ name: file.originalname, url: fileUrl, docType: file.fieldname || 'document' });
      } else {
        // Standard Property Images / Photos
        if (!property.images.includes(fileUrl)) {
          property.images.push(fileUrl);
        }
      }
    }

    await property.save();

    res.status(200).json({
      status: 'success',
      message: `${req.files.length} file(s) uploaded and saved to property successfully.`,
      data: {
        propertyId: property._id,
        submissionId: property.submissionId,
        uploadedCount: req.files.length,
        images: property.images,
        propertyDocuments: property.propertyDocuments,
        documents: property.documents,
        property,
        uploadedFiles: uploadedFilesMeta,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple photos, plans & brochures for a Project by ID
 * @route   POST /api/user/upload/project/:id
 * @route   PATCH /api/user/upload/project/:id
 * @access  Private / Public
 */
exports.uploadProjectFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find Project
    const project = await findProjectById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: `Developer project not found with ID: ${id}`,
      });
    }

    // 2. Validate uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide at least one file to upload (form-data fields: projectPhotos, photos, images, masterPlan, floorPlan, brochure, etc.).',
      });
    }

    const shouldReplacePhotos = req.query.replace === 'true' || req.body.replace === 'true';
    if (shouldReplacePhotos) {
      project.projectPhotos = [];
    } else {
      project.projectPhotos = project.projectPhotos || [];
    }

    const uploadedFilesMeta = [];

    // 3. Process each uploaded file and save to Project schema
    for (const file of req.files) {
      const fileUrl = getFileUrl(req, file.filename);
      const fieldname = (file.fieldname || '').toLowerCase();
      const isPdfOrDoc =
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('msword') ||
        file.mimetype.includes('document') ||
        file.originalname.toLowerCase().endsWith('.pdf') ||
        file.originalname.toLowerCase().endsWith('.docx');

      uploadedFilesMeta.push({
        fieldname: file.fieldname,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl,
      });

      // Specific Plan / Brochure Fields
      if (fieldname.includes('masterplan') || fieldname === 'master_plan') {
        project.masterPlanUrl = fileUrl;
      } else if (fieldname.includes('floorplan') || fieldname === 'floor_plan') {
        project.floorPlanUrl = fileUrl;
      } else if (fieldname.includes('brochure') || fieldname === 'project_brochure') {
        project.brochureUrl = fileUrl;
      } else if (isPdfOrDoc) {
        if (!project.brochureUrl) {
          project.brochureUrl = fileUrl;
        } else if (!project.masterPlanUrl) {
          project.masterPlanUrl = fileUrl;
        } else {
          project.floorPlanUrl = fileUrl;
        }
      } else {
        // Standard Project Photos / Images
        if (!project.projectPhotos.includes(fileUrl)) {
          project.projectPhotos.push(fileUrl);
        }
      }
    }

    await project.save();

    res.status(200).json({
      status: 'success',
      message: `${req.files.length} file(s) uploaded and saved to project successfully.`,
      data: {
        projectId: project._id,
        submissionId: project.submissionId,
        uploadedCount: req.files.length,
        projectPhotos: project.projectPhotos,
        masterPlanUrl: project.masterPlanUrl,
        floorPlanUrl: project.floorPlanUrl,
        brochureUrl: project.brochureUrl,
        // project,
        // uploadedFiles: uploadedFilesMeta,
      },
    });
  } catch (error) {
    next(error);
  }
};
