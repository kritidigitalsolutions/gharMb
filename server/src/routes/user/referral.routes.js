/**
 * User Refer & Earn Routes
 * Endpoints for Referral Code Validation, Live Invite Dashboard,
 * Friend Referral History, and GharMB Coin Wallet.
 */

const express = require('express');
const referralController = require('../../controllers/user/referral.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

const optionalAuth = userAuth.optionalUserAuth || userAuth;

// ── 1. Validate Referral Code (Public / Available on detail add screen before registration)
router.post('/validate-code', optionalAuth, referralController.validateReferralCode);
router.post('/validate', optionalAuth, referralController.validateReferralCode);
router.get('/validate/:code', optionalAuth, (req, res, next) => {
  req.body = { ...req.body, referralCode: req.params.code };
  return referralController.validateReferralCode(req, res, next);
});

// ── 2. Authenticated Endpoints ───────────────────────────────────────────────
router.use(userAuth);

// Live Dashboard (Matching the mobile screen "Invite Friends & Earn ₹250")
router.get('/dashboard', referralController.getReferralDashboard);
router.get('/my-code', referralController.getReferralDashboard);
router.get('/my-referral', referralController.getReferralDashboard);

// Invited Friends History
router.get('/history', referralController.getReferralHistory);
router.get('/my-friends', referralController.getReferralHistory);
router.get('/my-referrals', referralController.getReferralHistory);

// Apply Referral Code Post-Signup (before first property listing)
router.post('/apply-code', referralController.applyReferralCode);
router.post('/apply', referralController.applyReferralCode);

// Claim Referral Reward (Submitted to Admin for Out-of-App Payment)
router.post('/claim', referralController.claimReferralReward);
router.post('/:id/claim', referralController.claimReferralReward);
router.get('/claims', referralController.getMyClaims);
router.get('/my-claims', referralController.getMyClaims);

// Coins Wallet & Transaction Ledger
router.get('/wallet', referralController.getCoinsWallet);
router.get('/coins', referralController.getCoinsWallet);

module.exports = router;
