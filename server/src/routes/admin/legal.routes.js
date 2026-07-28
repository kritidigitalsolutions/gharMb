/**
 * Admin Legal Content Routes
 * Exposes admin endpoints to read and update legal documents.
 */

const express = require('express');
const legalController = require('../../controllers/admin/legal.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply auth protection & admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

// GET and PUT /api/admin/legal/:type
router.route('/:type')
  .get(legalController.getLegalContent)
  .put(legalController.updateLegalContent);

module.exports = router;
