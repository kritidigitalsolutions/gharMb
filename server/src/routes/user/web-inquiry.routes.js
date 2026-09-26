const express = require('express');
const webInquiryController = require('../../controllers/user/web-inquiry.controller');

const router = express.Router();

router.post('/', webInquiryController.createWebInquiry);

module.exports = router;
