const express = require('express');
const webInquiryController = require('../../controllers/admin/web-inquiry.controller');
const protect = require('../../middlewares/auth.middleware');

const router = express.Router();

// All admin web-inquiry routes are protected
router.use(protect);

router.get('/stats', webInquiryController.getWebInquiryStats);
router.post('/bulk-delete', webInquiryController.bulkDeleteWebInquiries);

router.route('/')
  .get(webInquiryController.getAllWebInquiries);

router.route('/:id')
  .get(webInquiryController.getWebInquiryById)
  .patch(webInquiryController.updateWebInquiry)
  .delete(webInquiryController.deleteWebInquiry);

module.exports = router;
