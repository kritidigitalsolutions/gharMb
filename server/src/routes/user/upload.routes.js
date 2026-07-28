/**
 * File Upload Routes
 * Exposes endpoints for uploading single and multiple files/photos with flexible field names.
 */

const express = require('express');
const upload = require('../../middlewares/upload.middleware');
const uploadController = require('../../controllers/user/upload.controller');

const router = express.Router();

// Single file upload endpoint (Accepts any key name: "file", "document", "photo", etc.)
router.post('/single', upload.any(), (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.file = req.files[0];
  }
  uploadController.uploadSingleFile(req, res, next);
});

// Multiple files upload endpoint (Accepts any key name: "file", "files", "photos", "images", etc.)
router.post('/multiple', upload.any(), uploadController.uploadMultipleFiles);

module.exports = router;
