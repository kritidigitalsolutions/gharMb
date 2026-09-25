const express = require('express');
const blogController = require('../../controllers/admin/blog.controller');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// Upload image for blog banner or editor
router.post('/upload', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No image file uploaded.',
      });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
      status: 'success',
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Bulk operations
router.post('/bulk-delete', blogController.bulkDeleteBlogs);
router.patch('/bulk-status', blogController.bulkUpdateStatus);

// Blog CRUD
router
  .route('/')
  .get(blogController.getAllBlogs)
  .post(blogController.createBlog);

router
  .route('/:id')
  .get(blogController.getBlogById)
  .put(blogController.updateBlog)
  .delete(blogController.deleteBlog);

// Publish & Unpublish actions
router.patch('/:id/publish', blogController.publishBlog);
router.patch('/:id/unpublish', blogController.unpublishBlog);

module.exports = router;

