/**
 * Token Request Routes
 * Endpoints for submitting, viewing, accepting, and rejecting property token booking requests.
 */

const express = require('express');
const tokenRequestController = require('../../controllers/user/token-request.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// All routes require user authentication
router.use(userAuth);

router.post('/', tokenRequestController.createTokenRequest);

router.get('/', tokenRequestController.getReceivedTokenRequests);

router.get('/my-requests', tokenRequestController.getSentTokenRequests);

router.get('/:id', tokenRequestController.getTokenRequestById);

router.patch('/:id/accept', tokenRequestController.acceptTokenRequest);

router.patch('/:id/reject', tokenRequestController.rejectTokenRequest);

module.exports = router;
