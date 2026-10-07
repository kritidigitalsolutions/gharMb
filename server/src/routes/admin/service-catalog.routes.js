/**
 * Admin Service Catalog & Pricing Routes
 * Exposes endpoints for managing service offerings, packages, and partners.
 */

const express = require('express');
const catalogController = require('../../controllers/admin/service-catalog.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth boundaries
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(catalogController.getAllOfferings)
  .post(catalogController.createOffering);

router.post('/seed', catalogController.seedDefaultCatalog);

router.route('/:id')
  .get(catalogController.getOfferingById)
  .patch(catalogController.updateOffering)
  .put(catalogController.updateOffering)
  .delete(catalogController.deleteOffering);

module.exports = router;
