/**
 * Admin Token Management Routes
 * Endpoints for administrators to view, audit, release, refund tokens,
 * and configure global and per-property token amounts.
 */

const express = require('express');
const tokenController = require('../../controllers/admin/token.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Require Admin authorization for all endpoints
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// 1. Global Token Amount Settings (Set by Admin)
router.route('/settings')
  .get(tokenController.getTokenSettings)
  .patch(tokenController.updateTokenSettings)
  .put(tokenController.updateTokenSettings);

// 2. Property Specific Token Amount Settings
router.route('/property/:propertyId/settings')
  .patch(tokenController.updatePropertyTokenSettings);

// 3. Token Escrow Transactions List & Create
router.route('/')
  .get(tokenController.getAllTokens)
  .post(tokenController.createToken);

// 4. Token Booking Details & Delete
router.route('/:id')
  .get(tokenController.getTokenById)
  .delete(tokenController.deleteToken);

router.route('/:id/status')
  .patch(tokenController.updateTokenStatus);

module.exports = router;
