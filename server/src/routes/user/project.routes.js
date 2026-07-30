/**
 * App Developer Project Routes
 * Links routes for project feed, detail retrieval, builder project creation, and ownership edits.
 */

const express = require('express');
const projectController = require('../../controllers/user/project.controller');
const userAuth = require('../../middlewares/userAuth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects & Developments
 *   description: Endpoints for browsing and managing builder/developer projects
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieve list of all projects (with optional status filters)
 *     tags: [Projects & Developments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, suspended]
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
router.get('/', projectController.getAllProjects);

/**
 * @swagger
 * /api/projects/my-projects:
 *   get:
 *     summary: Retrieve the current authenticated developer's projects list
 *     tags: [Projects & Developments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Developer's projects list
 *       401:
 *         description: Unauthorized
 */
router.get('/my-projects', userAuth, projectController.getMyProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Retrieve detailed project info by ID
 *     tags: [Projects & Developments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *       404:
 *         description: Project not found
 */
router.get('/:id', projectController.getProjectDetails);

// Protected Write Operations (Creation & Edits)
router.use(userAuth);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new developer/builder project listing
 *     tags: [Projects & Developments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Greenwood Residency"
 *               description:
 *                 type: string
 *                 example: "A premium eco-friendly township development"
 *               location:
 *                 type: string
 *                 example: "Sector 150, Noida"
 *     responses:
 *       201:
 *         description: Project listing created successfully
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 */
router.post('/', projectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update an existing project listing
 *     tags: [Projects & Developments]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         description: Unauthorized/Not owner
 *       404:
 *         description: Project not found
 *   delete:
 *     summary: Delete a project listing
 *     tags: [Projects & Developments]
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
 *         description: Unauthorized/Not owner
 *       404:
 *         description: Project not found
 */
router.route('/:id')
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;

