const express = require('express');
const faqController = require('../../controllers/admin/faq.controller');

const router = express.Router();

router
  .route('/')
  .get(faqController.getAllFaqs)
  .post(faqController.createFaq);

router.post('/bulk-delete', faqController.bulkDeleteFaqs);
router.put('/reorder', faqController.reorderFaqs);

router
  .route('/:id')
  .put(faqController.updateFaq)
  .delete(faqController.deleteFaq);

module.exports = router;
