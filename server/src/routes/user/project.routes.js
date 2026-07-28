/**
 * App Developer Project Routes
 * Links routes for project feed, detail retrieval, builder project creation, and ownership edits.
 */

const express = require('express');
const projectController = require('../../controllers/user/project.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Publicly accessible explore projects feed & details
router.get('/', projectController.getAllProjects);

// Protected My Projects list
router.get('/my-projects', userAuth, projectController.getMyProjects);

// Public detail view
router.get('/:id', projectController.getProjectDetails);

// Protected Write Operations (Creation & Edits)
router.use(userAuth);

router.post('/', projectController.createProject);
router.route('/:id')
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;
