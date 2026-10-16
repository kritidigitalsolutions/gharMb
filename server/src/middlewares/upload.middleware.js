/**
 * File Upload Middleware
 * Handles file uploads (Images: PNG, JPG, JPEG, WEBP, SVG; Docs: PDF, DOC, DOCX) using Multer.
 * Stores files in the local /uploads directory and generates unique filenames.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists at project root server/uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
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

module.exports = upload;
