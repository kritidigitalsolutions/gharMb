/**
 * Admin Banner Routes
 * Administrator management of home and section banners with Multer upload support.
 */

const express = require('express');
const bannerController = require('../../controllers/admin/banner.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// Route level authentication and authorization
router.use(protect);
router.use(restrictTo('admin'));

// Upload configuration for banner desktop & mobile images
const bannerUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]);

router.route('/')
  .get(bannerController.getAllBanners)
  .post(bannerUpload, bannerController.createBanner);

router.put('/reorder', bannerController.reorderBanners);
router.post('/bulk-delete', bannerController.bulkDeleteBanners);

router.route('/:id')
  .get(bannerController.getBannerById)
  .put(bannerUpload, bannerController.updateBanner)
  .delete(bannerController.deleteBanner);

router.patch('/:id/status', bannerController.toggleBannerStatus);

module.exports = router;
