/**
 * Admin User Management Routes
 * Exposes account viewing, suspending, Agent RERA verification, and Developer company verification updates.
 */

const express = require('express');
const userController = require('../../controllers/admin/user.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Route level protections
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.get('/pending-agents', userController.getPendingAgents);
router.get('/pending-developers', userController.getPendingDevelopers);

router.route('/:id')
  .get(userController.getUserDetails)
  .delete(userController.deactivateUser);

router.patch('/:id/verify-agent', userController.verifyAgent);
router.patch('/:id/verify-developer', userController.verifyDeveloper);

module.exports = router;
