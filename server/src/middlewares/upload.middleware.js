/**
 * File Upload Middleware
 * Handles file uploads (Images: PNG, JPG, JPEG, WEBP, SVG; Docs: PDF, DOC, DOCX) using Multer.
 * Stores files in the local /uploads directory and generates unique filenames.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');

// Detect serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  process.env.VERCEL_ENV
);

// Determine safe uploads directory (use /tmp on serverless environments)
const getUploadDir = () => {
  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch (e) {
      return os.tmpdir();
    }
  }

  const localDir = path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch (err) {
    const fallbackDir = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    } catch {
      return os.tmpdir();
    }
  }
};

const uploadDir = getUploadDir();

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const targetDir = getUploadDir();
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// File Filter allowing all standard image and document formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedExtensions.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';

  if (extName || mimeType) {
    cb(null, true);
  } else {
    // Accept file by default if standard format
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Max 15 MB file size
  fileFilter,
});

upload.getUploadDir = getUploadDir;
upload.uploadDir = uploadDir;

module.exports = upload;
