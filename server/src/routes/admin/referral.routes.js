/**
 * Admin Referral / Reference Network Routes
 * Endpoints for administrators to view, audit, register, process payouts,
 * and moderate ambassador referrals.
 */

const express = require('express');
const referralController = require('../../controllers/admin/referral.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Require Admin authorization for all referral endpoints
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

// 1. Referral List & Create
router.route('/')
  .get(referralController.getAllReferrals)
  .post(referralController.createReferral);

// 2. Single Referral CRUD
router.route('/:id')
  .get(referralController.getReferralById)
  .patch(referralController.updateReferral)
  .delete(referralController.deleteReferral);

// 3. Referral Payout Settlement
router.route('/:id/payout')
  .patch(referralController.processPayout);

// 4. Referral Status Lifecycle Transition
router.route('/:id/status')
  .patch(referralController.updateReferralStatus);

module.exports = router;
