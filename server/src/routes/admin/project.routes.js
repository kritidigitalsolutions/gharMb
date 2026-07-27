/**
 * Admin Developer Project Routes
 * Provides review and approval endpoints for Developer / Builder Projects.
 */

const express = require('express');
const projectController = require('../../controllers/admin/project.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', projectController.getAllProjects);
router.patch('/:id/status', projectController.updateProjectStatus);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
