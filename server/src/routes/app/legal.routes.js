/**
 * App Public Legal Content Routes
 * Exposes public endpoints for reading legal documents.
 */

const express = require('express');
const legalController = require('../../controllers/app/legal.controller');

const router = express.Router();

// GET /api/legal/:type - Retrieve legal content
router.get('/:type', legalController.getLegalContent);

module.exports = router;
