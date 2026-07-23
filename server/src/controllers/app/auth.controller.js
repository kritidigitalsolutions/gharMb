/**
 * App Authentication Controller
 * Manages client registrations and credentials-based login.
 */

const User = require('../../models/user.model');
const jwt = require('jsonwebtoken');

// Sign JWT helper function
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new app user profile
// @route   POST /api/v1/app/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, password, and role.',
      });
    }

    // Check unique records
    const searchConditions = [{ email }];
    if (phone) searchConditions.push({ phone });

    const existingUser = await User.findOne({ $or: searchConditions });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'A user account with this email or phone number already exists.',
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role,
    });

    const token = signToken(newUser._id, newUser.role);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate app user credentials and return session token
// @route   POST /api/v1/app/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
