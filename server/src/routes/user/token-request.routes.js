/**
 * Token Request Routes
 * Endpoints for retrieving token configuration, submitting 5-step token bookings,
 * viewing, accepting, rejecting, and cancelling property token booking requests.
 */

const express = require('express');
const tokenRequestController = require('../../controllers/user/token-request.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

/**
 * Safe Multer middleware for document uploads (ID proof)
 */
const safeUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'fail',
          message: 'Document file size exceeds 15MB limit.',
        });
      }
      return res.status(400).json({
        status: 'fail',
        message: err.message || 'File upload error occurred.',
      });
    }
    next();
  });
};

// Public/Optional auth: Get token booking configuration (Amounts configured by Admin)
router.get('/config', tokenRequestController.getTokenConfig);

// All subsequent routes require user authentication
router.use(userAuth);

router.post('/', safeUpload, tokenRequestController.createTokenRequest);

router.get('/', tokenRequestController.getReceivedTokenRequests);

router.get('/my-requests', tokenRequestController.getSentTokenRequests);

router.get('/:id', tokenRequestController.getTokenRequestById);

router.patch('/:id/accept', tokenRequestController.acceptTokenRequest);

router.patch('/:id/reject', tokenRequestController.rejectTokenRequest);

router.patch('/:id/cancel', tokenRequestController.cancelTokenRequest);

module.exports = router;
