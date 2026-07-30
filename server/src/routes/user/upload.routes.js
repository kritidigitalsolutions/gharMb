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
router.post('/single', upload.any(), (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.file = req.files[0];
  }
  uploadController.uploadSingleFile(req, res, next);
});

/**
 * @swagger
 * /api/user/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [File Uploads]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The files to upload (accepts any key name like "files", "photos", "images")
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post('/multiple', upload.any(), uploadController.uploadMultipleFiles);

module.exports = router;

