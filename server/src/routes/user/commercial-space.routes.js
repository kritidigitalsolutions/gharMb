/**
 * User Commercial Space Routes
 * Public search, near-me, featured, space types breakdown, detail retrieval + authenticated create/update/delete.
 */

const express = require('express');
const commercialSpaceController = require('../../controllers/user/commercial-space.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// GET /api/commercial-spaces (Paginated search with spaceType, listingFor, city, locality, price, area, search...)
router.get('/', commercialSpaceController.getAllSpaces);

// GET /api/commercial-spaces/latest (Paginated latest commercial listings sorted newest first)
router.get('/latest', commercialSpaceController.getLatestSpaces);

// GET /api/commercial-spaces/featured (Paginated featured/premium commercial listings)
router.get('/featured', commercialSpaceController.getFeaturedSpaces);

// GET /api/commercial-spaces/types (Summary counts by spaceType: Shop, Office, Showroom, etc.)
router.get('/types', commercialSpaceController.getSpaceTypes);

// GET /api/commercial-spaces/near-me (Paginated geospatial or city proximity search)
router.get('/near-me', commercialSpaceController.getNearMeSpaces);

// GET /api/commercial-spaces/my-dashboard (Protected – must come before /:id)
router.get('/my-dashboard', userAuth, commercialSpaceController.getMyDashboard);

// GET /api/commercial-spaces/:id (Get single commercial space detail)
router.get('/:id', commercialSpaceController.getSpaceDetails);

// ─── Protected Write Routes ───────────────────────────────────────────────────
router.use(userAuth);

// POST /api/commercial-spaces (Submit new commercial listing)
router.post('/', commercialSpaceController.createSpace);

// PUT  /api/commercial-spaces/:id (Update listing - resets to pending review)
// DELETE /api/commercial-spaces/:id (Delete owned listing)
router.route('/:id')
  .put(commercialSpaceController.updateSpace)
  .delete(commercialSpaceController.deleteSpace);

module.exports = router;
