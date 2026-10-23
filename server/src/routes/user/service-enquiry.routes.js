/**
 * Service Enquiry Routes (App & Web)
 * Exposes endpoints for Packers & Movers, Legal Services, and Interior Design inquiries.
 * Inquiries are recorded directly in MongoDB and immediately routed to the Admin panel.
 */

const express = require('express');
const serviceEnquiryController = require('../../controllers/user/service-enquiry.controller');
const userAuth = require('../../middlewares/userAuth.middleware');
const { optionalUserAuth } = userAuth;

const router = express.Router();

// 1. Dynamic Catalog / Configuration for App & Web
router.get('/catalogs', serviceEnquiryController.getServiceCatalogs);

// 2. Packers & Movers Quote Request
router.post('/movers/enquiry', optionalUserAuth, serviceEnquiryController.createMoversEnquiry);

// 3. Legal Services Consultation Booking
router.post('/legal/enquiry', optionalUserAuth, serviceEnquiryController.createLegalEnquiry);

// 4. Interior Design Consultation Booking
router.post('/interior/enquiry', optionalUserAuth, serviceEnquiryController.createInteriorEnquiry);

// 5. Home Loan Real-time Quick Eligibility & EMI Calculator
router.all(['/loan/calculate', '/loan/calculate-eligibility', '/home-loan/calculate-eligibility', '/calculate-eligibility', '/calculate'], serviceEnquiryController.calculateHomeLoanEligibility);

// 6. Home Loan Quote & Quick Eligibility Check Enquiry (Sends to Admin)
router.post(
  [
    '/',
    '/loan/enquiry',
    '/loans/enquiry',
    '/home-loan/enquiry',
    '/home-loans/enquiry',
    '/loan',
    '/loans',
    '/home-loan',
    '/home-loans',
  ],
  optionalUserAuth,
  (req, res, next) => {
    // If request has monthlyIncome or loan data or is on loan route, call createHomeLoanEnquiry
    if (
      req.baseUrl?.includes('loan') ||
      req.path?.includes('loan') ||
      req.body.monthlyIncome ||
      req.body.monthlyNetIncome ||
      req.body.propertyValue ||
      req.body.estimatedPropertyValue ||
      req.body.existingEmis ||
      req.body.loanRequired
    ) {
      return serviceEnquiryController.createHomeLoanEnquiry(req, res, next);
    }
    // Otherwise fallback to unified enquiry
    return serviceEnquiryController.createUnifiedEnquiry(req, res, next);
  }
);

// 7. Unified Generic Service Enquiry
router.post('/enquiry', optionalUserAuth, serviceEnquiryController.createUnifiedEnquiry);

// 6. User Personal Enquiries History (Requires Login)
router.get('/my-enquiries', userAuth, serviceEnquiryController.getMyEnquiries);

// 7. Public Enquiry Status & Timeline Tracking (Supports /track/:id, /enquiry/:id, and /:id)
router.get('/track/:id', serviceEnquiryController.trackServiceEnquiry);
router.get('/enquiry/:id', serviceEnquiryController.trackServiceEnquiry);
router.get('/:id', serviceEnquiryController.trackServiceEnquiry);

module.exports = router;
