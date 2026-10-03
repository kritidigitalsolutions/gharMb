/**
 * Visit Request Routes
 * Endpoints for scheduling, fetching, accepting, and rejecting property/site visit requests.
 */

const express = require('express');
const visitRequestController = require('../../controllers/user/visit-request.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// All routes require user authentication
router.use(userAuth);

// 1. Create a visit request
router.post('/', visitRequestController.createVisitRequest);

// 2. Fetch visit requests received for the owner's properties
router.get('/', visitRequestController.getReceivedVisitRequests);

// 3. Fetch visit requests submitted by the logged-in user
router.get('/my-visits', visitRequestController.getUserVisitRequests);
router.get('/my-requests', visitRequestController.getUserVisitRequests);

// 4. Get single visit request details by ID
router.get('/:id', visitRequestController.getVisitRequestById);

// 5. Accept a visit request (Owner only)
router.patch('/:id/accept', visitRequestController.acceptVisitRequest);

// 6. Reject a visit request with owner message (Owner only)
router.patch('/:id/reject', visitRequestController.rejectVisitRequest);

module.exports = router;
