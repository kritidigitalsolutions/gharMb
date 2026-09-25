const express = require('express');
const faqController = require('../../controllers/user/faq.controller');

const router = express.Router();

router.get('/', faqController.getActiveFaqs);
router.get('/categories', faqController.getActiveCategories);

module.exports = router;
