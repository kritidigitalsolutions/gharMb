/**
 * Admin Visit Request Routes
 * Endpoints for Administrators to manage, accept, decline, and inspect site visit requests.
 */

const express = require('express');
const router = express.Router();
const visitRequestController = require('../../controllers/admin/visit-request.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

// Protect all admin visit request routes
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

router.get('/', visitRequestController.getAllVisitRequests);
router.get('/:id', visitRequestController.getVisitRequestById);
router.patch('/:id/accept', visitRequestController.acceptVisitRequest);
router.patch('/:id/reject', visitRequestController.rejectVisitRequest);
router.delete('/:id', visitRequestController.deleteVisitRequest);

module.exports = router;
