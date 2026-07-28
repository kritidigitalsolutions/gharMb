/**
 * App Enquiry Routes
 * Manages posting, fetching, and updating customer leads.
 */

const express = require('express');
const enquiryController = require('../../controllers/user/enquiry.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(userAuth);

// Buyer/Tenant endpoints
router.post(
  '/',
  restrictTo('buyer', 'tenant'),
  enquiryController.createEnquiry
);
router.get(
  '/my-enquiries',
  restrictTo('buyer', 'tenant'),
  enquiryController.getMyEnquiries
);

// Seller/Agent/Builder endpoints
router.get(
  '/received',
  restrictTo('owner', 'agent', 'builder'),
  enquiryController.getReceivedEnquiries
);
router.patch(
  '/:id',
  restrictTo('owner', 'agent', 'builder'),
  enquiryController.updateEnquiryStatus
);

module.exports = router;
