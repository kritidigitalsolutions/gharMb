const express = require('express');
const faqCategoryController = require('../../controllers/admin/faq-category.controller');

const router = express.Router();

router
  .route('/')
  .get(faqCategoryController.getAllCategories)
  .post(faqCategoryController.createCategory);

router.post('/bulk-delete', faqCategoryController.bulkDeleteCategories);

router
  .route('/:id')
  .put(faqCategoryController.updateCategory)
  .delete(faqCategoryController.deleteCategory);

module.exports = router;
