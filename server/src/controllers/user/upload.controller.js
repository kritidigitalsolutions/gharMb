/**
 * File Upload Controller
 * Production-ready, resilient file upload handlers for:
 * 1. General multiple file uploads (Multipart form-data & Base64 JSON)
 * 2. General single file upload
 * 3. Property file & document attachments
 * 4. Project photo & brochure attachments
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Property = require('../../models/property.model');
const Project = require('../../models/project.model');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Construct full public URL for uploaded files
 */
const getFileUrl = (req, filename) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:5001';
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * Helper to find Property by _id or submissionId
 */
const findPropertyById = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const prop = await Property.findById(id);
    if (prop) return prop;
  }
  return await Property.findOne({ submissionId: id });
};

/**
 * Helper to find Project by _id or submissionId
 */
const findProjectById = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const proj = await Project.findById(id);
    if (proj) return proj;
  }
  return await Project.findOne({ submissionId: id });
};

/**
 * Save a Base64 string or data URL to the disk in /uploads
 */
const saveBase64File = (base64String, fallbackName = 'upload') => {
  try {
    let mimeType = 'image/jpeg';
    let base64Data = base64String;

    const dataUrlMatch = base64String.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (dataUrlMatch && dataUrlMatch.length === 3) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('svg')) ext = 'svg';
    else if (mimeType.includes('gif')) ext = 'gif';

    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return {
      filename,
      originalname: `${fallbackName}.${ext}`,
      mimetype: mimeType,
      size: buffer.length,
    };
  } catch (err) {
    console.error('Error saving base64 file:', err.message);
    return null;
  }
};

/**
 * @desc    Upload multiple files (General multi-upload with auto property/project linking)
 * @route   POST /api/upload
 * @route   POST /api/upload/multiple
 * @route   POST /api/user/upload/multiple
 * @route   POST /api/admin/upload/multiple
 * @access  Public / Private
 */
exports.uploadMultipleFiles = async (req, res, next) => {
  try {
    const collectedFiles = [];

    // 1. Process files from multipart/form-data
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        collectedFiles.push({
          filename: f.filename,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          fieldname: f.fieldname,
        });
      }
    } else if (req.file) {
      collectedFiles.push({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname,
      });
    }

    // 2. Process Base64 or URL strings from JSON body (if provided)
    if (req.body) {
      const candidates = req.body.files || req.body.images || req.body.photos || req.body.documents || [];
      const list = Array.isArray(candidates) ? candidates : (typeof candidates === 'string' ? [candidates] : []);

      // Also check single field aliases
      if (typeof req.body.image === 'string') list.push(req.body.image);
      if (typeof req.body.file === 'string') list.push(req.body.file);

      list.forEach((item, index) => {
        if (!item || typeof item !== 'string') return;

        if (item.startsWith('data:') || (item.length > 200 && !item.startsWith('http'))) {
          const saved = saveBase64File(item, `image-${index + 1}`);
          if (saved) collectedFiles.push(saved);
        } else if (item.startsWith('http://') || item.startsWith('https://')) {
          // Keep existing HTTP URLs
          collectedFiles.push({
            isExistingUrl: true,
            url: item,
            fileUrl: item,
            filename: path.basename(item),
            originalname: path.basename(item),
            mimetype: 'image/jpeg',
            size: 0,
          });
        }
      });
    }

    // 3. Validate that at least one file was received
    if (collectedFiles.length === 0) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'No files provided. Please select one or more files in form-data (key: "files" or "images") or provide base64 strings in JSON.',
      });
    }

    // 4. Construct file URLs and metadata
    const fileUrls = [];
    const filesMeta = [];

    for (const f of collectedFiles) {
      const fileUrl = f.isExistingUrl ? f.url : getFileUrl(req, f.filename);
      fileUrls.push(fileUrl);
      filesMeta.push({
        url: fileUrl,
        fileUrl,
        filename: f.filename,
        originalName: f.originalname || f.filename,
        originalname: f.originalname || f.filename,
        mimeType: f.mimetype,
        mimetype: f.mimetype,
        size: f.size,
        fieldname: f.fieldname || 'files',
      });
    }

    // 5. Optional auto-attachment to Property
    const propertyId = req.query.propertyId || req.body?.propertyId;
    let property = null;
    if (propertyId) {
      property = await findPropertyById(propertyId);
      if (property) {
        property.images = property.images || [];
        fileUrls.forEach((u) => {
          if (!property.images.includes(u)) property.images.push(u);
        });
        await property.save();
      }
    }

    // 6. Optional auto-attachment to Project
    const projectId = req.query.projectId || req.body?.projectId;
    let project = null;
    if (projectId) {
      project = await findProjectById(projectId);
      if (project) {
        project.projectPhotos = project.projectPhotos || [];
        fileUrls.forEach((u) => {
          if (!project.projectPhotos.includes(u)) project.projectPhotos.push(u);
        });
        await project.save();
      }
    }

    // 7. Return comprehensive, developer-friendly response
    return res.status(200).json({
      status: 'success',
      success: true,
      message: `${collectedFiles.length} file(s) uploaded successfully.`,
      data: {
        urls: fileUrls,
        fileUrls,
        images: fileUrls,
        files: filesMeta,
        count: collectedFiles.length,
        totalFiles: collectedFiles.length,
        url: fileUrls[0],
        fileUrl: fileUrls[0],
        ...(property && { property }),
        ...(project && { project }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload a single file
 * @route   POST /api/upload/single
 * @route   POST /api/user/upload/single
 * @route   POST /api/admin/upload/single
 * @access  Public / Private
 */
exports.uploadSingleFile = async (req, res, next) => {
  try {
    let file = req.file || (req.files && req.files[0]);

    if (!file && req.body && (req.body.file || req.body.image)) {
      const item = req.body.file || req.body.image;
      if (typeof item === 'string' && (item.startsWith('data:') || item.length > 200)) {
        file = saveBase64File(item, 'single_upload');
      }
    }

    if (!file) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please select a file to upload.',
      });
    }

    const fileUrl = getFileUrl(req, file.filename);

    return res.status(200).json({
      status: 'success',
      success: true,
      message: 'File uploaded successfully.',
      data: {
        url: fileUrl,
        fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    next(error);
  }
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

    const property = await findPropertyById(id);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: `Property listing not found with ID: ${id}`,
      });
    }

    const rawFiles = req.files || (req.file ? [req.file] : []);
    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide at least one file to upload (form-data: images, photos, titleDeed, electricityBill, taxReceipt, khataExtract, etc.).',
      });
    }

    const shouldReplaceImages = req.query.replace === 'true' || req.body?.replace === 'true';
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

    for (const file of rawFiles) {
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
        url: fileUrl,
      });

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
        if (!property.images.includes(fileUrl)) {
          property.images.push(fileUrl);
        }
      }
    }

    await property.save();

    return res.status(200).json({
      status: 'success',
      success: true,
      message: `${rawFiles.length} file(s) uploaded and saved to property successfully.`,
      data: {
        propertyId: property._id,
        submissionId: property.submissionId,
        uploadedCount: rawFiles.length,
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

    const project = await findProjectById(id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        success: false,
        message: `Developer project not found with ID: ${id}`,
      });
    }

    const rawFiles = req.files || (req.file ? [req.file] : []);
    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: 'Please provide at least one file to upload (form-data: projectPhotos, photos, images, masterPlan, floorPlan, brochure, etc.).',
      });
    }

    const shouldReplacePhotos = req.query.replace === 'true' || req.body?.replace === 'true';
    if (shouldReplacePhotos) {
      project.projectPhotos = [];
    } else {
      project.projectPhotos = project.projectPhotos || [];
    }

    const uploadedFilesMeta = [];

    for (const file of rawFiles) {
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
        url: fileUrl,
      });

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
        if (!project.projectPhotos.includes(fileUrl)) {
          project.projectPhotos.push(fileUrl);
        }
      }
    }

    await project.save();

    return res.status(200).json({
      status: 'success',
      success: true,
      message: `${rawFiles.length} file(s) uploaded and saved to project successfully.`,
      data: {
        projectId: project._id,
        submissionId: project.submissionId,
        uploadedCount: rawFiles.length,
        projectPhotos: project.projectPhotos,
        masterPlanUrl: project.masterPlanUrl,
        floorPlanUrl: project.floorPlanUrl,
        brochureUrl: project.brochureUrl,
        uploadedFiles: uploadedFilesMeta,
      },
    });
  } catch (error) {
    next(error);
  }
};
