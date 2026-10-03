/**
 * File Upload Routes
 * Provides clean, robust endpoints for single and multiple file uploads.
 */

const express = require('express');
const upload = require('../../middlewares/upload.middleware');
const uploadController = require('../../controllers/user/upload.controller');

const router = express.Router();

/**
 * Safe Multer middleware wrapper that catches file errors (e.g. file size exceeded)
 * and returns clean JSON instead of throwing uncaught exceptions.
 */
const safeUploadAny = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'fail',
          success: false,
          message: 'One or more files exceed the maximum allowed size of 15MB.',
        });
      }
      return res.status(400).json({
        status: 'fail',
        success: false,
        message: err.message || 'File upload error occurred.',
      });
    }
    next();
  });
};

// 1. Multiple Files Upload (Aliases: / , /multiple , /multi)
router.route('/')
  .post(safeUploadAny, uploadController.uploadMultipleFiles);

router.route('/multiple')
  .post(safeUploadAny, uploadController.uploadMultipleFiles);

router.route('/multi')
  .post(safeUploadAny, uploadController.uploadMultipleFiles);

// 2. Single File Upload
router.route('/single')
  .post(safeUploadAny, uploadController.uploadSingleFile);

// 3. Property Files Upload (Images & Legal Docs)
router.route('/property/:id')
  .post(safeUploadAny, uploadController.uploadPropertyFiles)
  .patch(safeUploadAny, uploadController.uploadPropertyFiles);

// 4. Project Files Upload (Photos, Plans & Brochures)
router.route('/project/:id')
  .post(safeUploadAny, uploadController.uploadProjectFiles)
  .patch(safeUploadAny, uploadController.uploadProjectFiles);

module.exports = router;
