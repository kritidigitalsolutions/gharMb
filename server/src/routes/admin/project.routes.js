/**
 * Admin Developer Project Routes
 * Provides review and approval endpoints for Developer / Builder Projects.
 */

const express = require('express');
const projectController = require('../../controllers/admin/project.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Project Management
 *   description: Administrator endpoints for listing, status updates, and deleting developer projects
 */

router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/admin/projects:
 *   get:
 *     summary: Retrieve list of all developer projects (including pending)
 *     tags: [Admin Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);

/**
 * @swagger
 * /api/admin/projects/{id}/status:
 *   patch:
 *     summary: Update status of a developer project (approve or suspend)
 *     tags: [Admin Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, suspended]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Project status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.patch('/:id/status', projectController.updateProjectStatus);
router.patch('/:id/toggle-sold', projectController.toggleSoldStatus);

/**
 * @swagger
 * /api/admin/projects/{id}/investment-score:
 *   put:
 *     summary: Set baseline or update investment score metrics for a developer project
 *     tags: [Admin Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectivity
 *               - rentalPotential
 *               - growthPotential
 *               - familyLiving
 *               - futureDemand
 *             properties:
 *               connectivity:
 *                 type: number
 *                 example: 9.0
 *               rentalPotential:
 *                 type: number
 *                 example: 8.5
 *               growthPotential:
 *                 type: number
 *                 example: 9.0
 *               familyLiving:
 *                 type: number
 *                 example: 8.8
 *               futureDemand:
 *                 type: number
 *                 example: 9.0
 *     responses:
 *       200:
 *         description: Investment score updated successfully
 *       400:
 *         description: Invalid input metrics
 *       404:
 *         description: Project not found
 */
router.route('/:id/investment-score')
  .get(projectController.getInvestmentScore)
  .put(projectController.updateInvestmentScore);

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   delete:
 *     summary: Permanently delete a developer project listing
 *     tags: [Admin Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.route('/:id')
  .put(projectController.updateProject)
  .patch(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;


