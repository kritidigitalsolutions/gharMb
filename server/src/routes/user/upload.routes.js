/**
 * File Upload Routes
 * Exposes endpoints for uploading single and multiple files/photos with flexible field names.
 */

const express = require('express');
const upload = require('../../middlewares/upload.middleware');
const uploadController = require('../../controllers/user/upload.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: File Uploads
 *   description: Endpoints for uploading single or multiple files (images, documents)
 */

/**
 * @swagger
 * /api/user/upload/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [File Uploads]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (accepts any key name like "file", "photo", "document")
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
// Single file upload handler helper
const handleSingleUpload = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.file = req.files[0];
  }
  uploadController.uploadSingleFile(req, res, next);
};

// Single file routes (generic, with ID param, and specific entity routes)
router.post('/single', upload.any(), handleSingleUpload);
router.post('/single/property/:propertyId', upload.any(), handleSingleUpload);
router.post('/single/project/:projectId', upload.any(), handleSingleUpload);
router.post('/single/:id', upload.any(), handleSingleUpload);

// Multiple files routes (generic, with ID param, and specific entity routes)
router.post('/multiple', upload.any(), uploadController.uploadMultipleFiles);
router.post('/multiple/property/:propertyId', upload.any(), uploadController.uploadMultipleFiles);
router.post('/multiple/project/:projectId', upload.any(), uploadController.uploadMultipleFiles);
router.post('/multiple/:id', upload.any(), uploadController.uploadMultipleFiles);

module.exports = router;

