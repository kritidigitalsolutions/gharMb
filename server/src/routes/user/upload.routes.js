/**
 * File Upload Routes
 * Exposes 2 clean, dedicated endpoints for uploading multiple images, photos,
 * and PDF documents directly to a Property or Developer Project by ID.
 */

const express = require('express');
const upload = require('../../middlewares/upload.middleware');
const uploadController = require('../../controllers/user/upload.controller');

const router = express.Router();

// 1. Upload multiple images & documents for a Property by ID
// POST /api/user/upload/property/:id (or PATCH)
router.route('/property/:id')
  .post(upload.any(), uploadController.uploadPropertyFiles)
  .patch(upload.any(), uploadController.uploadPropertyFiles);

// 2. Upload multiple photos, plans & brochures for a Developer Project by ID
// POST /api/user/upload/project/:id (or PATCH)
router.route('/project/:id')
  .post(upload.any(), uploadController.uploadProjectFiles)
  .patch(upload.any(), uploadController.uploadProjectFiles);

module.exports = router;

