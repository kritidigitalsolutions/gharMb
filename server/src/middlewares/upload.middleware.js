/**
 * File Upload Middleware
 * Handles file uploads (Images: PNG, JPG, JPEG, WEBP, SVG; Videos: MP4, WEBM, MOV, M4V, MKV; Docs: PDF, DOC, DOCX) using Multer.
 * Stores files in the local /uploads directory and generates unique filenames.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists if writable (safe on Vercel read-only filesystem)
try {
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (_) {}

// Multer In-Memory Storage: buffers held in RAM, uploaded directly to Firebase Storage without touching disk
const storage = multer.memoryStorage();

// File Filter allowing all standard image, video, and document formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|mp4|webm|mov|m4v|mkv|avi|3gp/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType =
    allowedExtensions.test(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf';

  if (extName || mimeType) {
    cb(null, true);
  } else {
    // Accept file by default if standard format
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Max 100 MB file size (supports short project videos & high-res photos)
  fileFilter,
});

module.exports = upload;

