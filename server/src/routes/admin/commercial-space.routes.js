/**
 * Admin Commercial Space Routes
 * Exposes listing review, approval/rejection, featured-toggle, and deletion.
 */

const express = require('express');
const commercialSpaceController = require('../../controllers/admin/commercial-space.controller');
const protect    = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// GET  /api/admin/commercial-spaces
// Filters: ?spaceType=&listingFor=&approvalStatus=&search=&owner=
router.get('/', commercialSpaceController.getAllSpaces);

// DELETE /api/admin/commercial-spaces/:id
router.delete('/:id', commercialSpaceController.deleteSpace);

// PATCH  /api/admin/commercial-spaces/:id/status
// Body: { approvalStatus: 'approved' | 'rejected' | 'pending', rejectionReason?: string }
router.patch('/:id/status', commercialSpaceController.updateSpaceStatus);

// PATCH  /api/admin/commercial-spaces/:id/featured
// Body: { listingTier: 'Standard' | 'Featured' | 'Premium' }
router.patch('/:id/featured', commercialSpaceController.toggleFeatured);

module.exports = router;
