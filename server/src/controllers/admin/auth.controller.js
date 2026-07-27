/**
 * Admin Authentication Controller
 * Manages admin account creation, JWT login generation, and profile retrieval.
 */

const Admin = require('../../models/admin.model');
const jwt = require('jsonwebtoken');

// Sign JWT helper function
const signToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    Register a new system administrator
// @route   POST /api/admin/auth/register
// @access  Private/Public (depending on setup, typically seed script)
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admin with this email already exists.',
      });
    }

    const newAdmin = await Admin.create({
      name,
      email,
      password,
    });

    // Generate JWT token
    const token = signToken(newAdmin._id, newAdmin.role);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate administrator and return token
// @route   POST /api/admin/auth/login
// @access  Public
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password.',
      });
    }

    // Find admin by email and explicitly include password field
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = signToken(admin._id, admin.role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in administrator profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin Role only)
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        admin: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
