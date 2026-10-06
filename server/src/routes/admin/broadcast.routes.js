/**
 * Admin Broadcast Routes
 * Dedicated endpoints for creating, scheduling, querying, and managing platform broadcasts.
 */

const express = require('express');
const broadcastController = require('../../controllers/admin/broadcast.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply security boundaries: authenticated admin only
router.use(protect);
router.use(restrictTo('admin'));

router.get('/audience-estimate', broadcastController.getAudienceEstimate);

router.route('/')
  .get(broadcastController.getBroadcasts)
  .post(broadcastController.createBroadcast);

router.route('/:id')
  .get(broadcastController.getBroadcastById)
  .delete(broadcastController.deleteBroadcast);

router.post('/:id/resend', broadcastController.resendBroadcast);

module.exports = router;
