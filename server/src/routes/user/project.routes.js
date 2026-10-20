/**
 * App Developer Project Routes
 * Links routes for project feed, detail retrieval, builder project creation, ownership edits,
 * and user investment score rating & opinions.
 */

const express = require('express');
const projectController = require('../../controllers/user/project.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

router.get('/', projectController.getAllProjects);

router.get('/my-projects', userAuth, projectController.getMyProjects);

// Project Details (includes admin-curated investmentScore)
router.get('/:id', projectController.getProjectDetails);

// Protected Write Operations (Creation & Edits)
router.use(userAuth);

router.post('/', projectController.createProject);

router.route('/:id')
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;


