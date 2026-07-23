/**
 * App Client User Routes
 * Exposes endpoints for managing profile data and uploading credentials.
 */

const express = require('express');
const userController = require('../../controllers/app/user.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// All routes require login
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);

// Only sellers, builders, agents upload RERA/ID proofs
router.post(
  '/upload-documents',
  restrictTo('owner', 'agent', 'builder'),
  userController.uploadVerificationDocs
);

module.exports = router;
