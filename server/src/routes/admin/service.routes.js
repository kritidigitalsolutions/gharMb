/**
 * Admin Service Management Routes
 * Exposes full CRUD and partner workflow endpoints for platform services.
 */

const express = require('express');
const serviceController = require('../../controllers/admin/service.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth boundaries
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(serviceController.getAllServices)
  .post(serviceController.createService);

router.route('/:id')
  .get(serviceController.getServiceById)
  .patch(serviceController.updateService)
  .put(serviceController.updateService)
  .delete(serviceController.deleteService);

module.exports = router;
