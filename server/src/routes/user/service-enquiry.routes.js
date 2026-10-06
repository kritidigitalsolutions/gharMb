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

// 5. Unified Generic Service Enquiry
router.post('/enquiry', optionalUserAuth, serviceEnquiryController.createUnifiedEnquiry);

// 6. User Personal Enquiries History (Requires Login)
router.get('/my-enquiries', userAuth, serviceEnquiryController.getMyEnquiries);

// 7. Public Enquiry Status & Timeline Tracking (Supports /track/:id, /enquiry/:id, and /:id)
router.get('/track/:id', serviceEnquiryController.trackServiceEnquiry);
router.get('/enquiry/:id', serviceEnquiryController.trackServiceEnquiry);
router.get('/:id', serviceEnquiryController.trackServiceEnquiry);

module.exports = router;
