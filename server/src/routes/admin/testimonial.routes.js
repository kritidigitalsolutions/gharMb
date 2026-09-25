const express = require('express');
const router = express.Router();
const testimonialController = require('../../controllers/admin/testimonial.controller');
const upload = require('../../middlewares/upload.middleware');
// const { protect, authorize } = require('../../middlewares/auth'); // If authentication is needed. Let's look at how faq is doing it.

// Assuming protect/authorize are handled in app.js or similar to faq routes
router.get('/', testimonialController.getTestimonials);
router.post('/', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'propertyImage', maxCount: 1 }]), testimonialController.createTestimonial);
router.post('/bulk-delete', testimonialController.bulkDeleteTestimonials);
router.put('/reorder', testimonialController.reorderTestimonials);
router.get('/:id', testimonialController.getTestimonialById);
router.put('/:id', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'propertyImage', maxCount: 1 }]), testimonialController.updateTestimonial);
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;
