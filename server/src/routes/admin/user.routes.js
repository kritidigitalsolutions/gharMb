/**
 * Admin User Management Routes
 * Exposes account viewing, suspending, and verification updates.
 */

const express = require('express');
const userController = require('../../controllers/admin/user.controller');
const protect = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const router = express.Router();

// Route level protections
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(userController.getAllUsers);

router.route('/:id')
  .get(userController.getUserDetails)
  .delete(userController.deactivateUser);

router.patch('/:id/verify', userController.verifyUser);

module.exports = router;
