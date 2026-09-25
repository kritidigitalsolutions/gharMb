const express = require('express');
const blogCategoryController = require('../../controllers/admin/blog-category.controller');

const router = express.Router();

router
  .route('/')
  .get(blogCategoryController.getAllCategories)
  .post(blogCategoryController.createCategory);

router.post('/bulk-delete', blogCategoryController.bulkDeleteCategories);

router
  .route('/:id')
  .put(blogCategoryController.updateCategory)
  .delete(blogCategoryController.deleteCategory);

module.exports = router;

