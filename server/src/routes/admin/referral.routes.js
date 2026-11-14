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

// 2. Global Referral Settings (Offer message, template, active state)
router.route('/settings')
  .get(referralController.getReferralSettings)
  .patch(referralController.updateReferralSettings)
  .put(referralController.updateReferralSettings);

// 3. Single Referral CRUD
router.route('/:id')
  .get(referralController.getReferralById)
  .patch(referralController.updateReferral)
  .delete(referralController.deleteReferral);

// 3. Referral Out-of-App Payout Settlement
router.route('/:id/payout')
  .patch(referralController.processPayout);
router.route('/:id/settle-payout')
  .patch(referralController.processPayout)
  .post(referralController.processPayout);

// 4. Reject Referral Claim
router.route('/:id/reject-claim')
  .patch(referralController.rejectClaim)
  .post(referralController.rejectClaim);

// 5. Manual Refer & Earn Coins Credit Override
router.route('/:id/credit-coins')
  .post(referralController.creditReferralCoins)
  .patch(referralController.creditReferralCoins);

// 5. Referral Status Lifecycle Transition
router.route('/:id/status')
  .patch(referralController.updateReferralStatus);

module.exports = router;
