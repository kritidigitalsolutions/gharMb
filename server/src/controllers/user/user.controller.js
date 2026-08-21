/**
 * App User Controller
 * Manages user profile retrievals, profile edits, Agent & Developer registrations, and verification uploads.
 */

const User = require('../../models/user.model');
const jwt = require('jsonwebtoken');

// Helper to normalize phone numbers (+91XXXXXXXXXX)
const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
};

// Sign JWT helper function
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'gharmb_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Get current user profile
// @route   GET /api/user/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PATCH /api/user/users/update-me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone, profilePicture, address, latitude, longitude } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      // Check phone uniqueness
      const existingUser = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'This mobile number is already registered with another account.',
        });
      }
      updateData.phone = normalizedPhone;
    }

    if (profilePicture) updateData.profilePicture = profilePicture;
    if (address) {
      updateData.address = typeof address === 'string' ? { formattedAddress: address } : address;
    }
    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register as Real Estate Agent / Broker (Full Name, Mobile Number, RERA Registration & Docs Submission)
// @route   POST /api/user/users/register-agent
// @access  Private
exports.registerAgent = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      mobileNumber,
      reraNumber,
      experience,
      cityOfOperation,
      reraCertificate,
      aadhaarCard,
      profilePhoto,
    } = req.body;

    if (!reraNumber || !cityOfOperation) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide RERA registration number and city of operation.',
      });
    }

    // 1. Strict RERA Number Uniqueness Check
    const existingRera = await User.findOne({
      reraNumber,
      _id: { $ne: req.user._id },
    });
    if (existingRera) {
      return res.status(400).json({
        status: 'fail',
        message: 'An agent or developer with this RERA registration number is already registered.',
      });
    }

    const updateData = {
      role: 'agent',
      reraNumber,
      experience: experience || '1-3 yrs',
      cityOfOperation,
      verificationDocs: {
        reraCertificate: reraCertificate || '',
        aadhaarCard: aadhaarCard || '',
        profilePhoto: profilePhoto || '',
      },
      agentVerificationStatus: 'pending',
    };

    if (name) updateData.name = name;

    // 2. Strict Mobile Number Uniqueness Check
    const phoneInput = phone || mobileNumber;
    if (phoneInput) {
      const normalizedPhone = normalizePhone(phoneInput);
      const existingPhoneUser = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.user._id },
      });
      if (existingPhoneUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'This mobile number is already registered with another account.',
        });
      }
      updateData.phone = normalizedPhone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    // Notify administrators about the pending agent verification
    try {
      const Admin = require('../../models/admin.model');
      const Notification = require('../../models/notification.model');
      const admins = await Admin.find().select('_id');
      if (admins.length > 0) {
        const notificationsData = admins.map((admin) => ({
          recipient: admin._id,
          title: 'New Agent Verification Pending',
          message: `Agent ${user.name} (${user.cityOfOperation || 'India'}) has submitted RERA credentials (${user.reraNumber}) for review.`,
          type: 'verification',
          isRead: false,
        }));
        await Notification.insertMany(notificationsData);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for agent registration:', notifErr);
    }

    // Issue fresh JWT token with updated 'agent' role
    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'Agent registration & verification documents submitted successfully! Admin will review within 24-48 hours.',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          reraNumber: user.reraNumber,
          experience: user.experience,
          cityOfOperation: user.cityOfOperation,
          verificationDocs: user.verificationDocs,
          agentVerificationStatus: user.agentVerificationStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register as Developer / Builder (Company Name, Full Name, Phone, RERA, PAN & Logo Submission)
// @route   POST /api/users/register-developer
// @access  Private
exports.registerDeveloper = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      mobileNumber,
      companyName,
      reraNumber,
      gstNumber,
      yearsInBusiness,
      cityOfOperation,
      reraCertificate,
      panCard,
      companyLogo,
      bio,
      unitsDelivered,
      isIsoCertified,
      submitForVerification,
    } = req.body;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const updateData = {
      role: 'builder',
    };

    // Update name if provided
    if (name) updateData.name = name;

    // Strict Mobile Number Uniqueness Check (only if different phone provided)
    const phoneInput = phone || mobileNumber;
    if (phoneInput) {
      const normalizedPhone = normalizePhone(phoneInput);
      if (normalizedPhone !== currentUser.phone) {
        const existingPhoneUser = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: req.user._id },
        });
        if (existingPhoneUser) {
          return res.status(400).json({
            status: 'fail',
            message: 'This mobile number is already registered with another account.',
          });
        }
        updateData.phone = normalizedPhone;
      }
    }

    // Update Step 1 details
    if (companyName !== undefined) updateData.companyName = companyName;
    
    // Strict RERA Number Uniqueness Check (only if different RERA provided)
    if (reraNumber !== undefined) {
      if (reraNumber && reraNumber !== currentUser.reraNumber) {
        const existingRera = await User.findOne({
          reraNumber,
          _id: { $ne: req.user._id },
        });
        if (existingRera) {
          return res.status(400).json({
            status: 'fail',
            message: 'A developer or agent with this RERA registration number is already registered.',
          });
        }
      }
      updateData.reraNumber = reraNumber;
    }
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (yearsInBusiness !== undefined) updateData.yearsInBusiness = yearsInBusiness;
    if (cityOfOperation !== undefined) updateData.cityOfOperation = cityOfOperation;

    // Update Step 2 details (documents)
    const existingDocs = currentUser.builderDocs || {};
    updateData.builderDocs = {
      reraCertificate: reraCertificate !== undefined ? reraCertificate : (existingDocs.reraCertificate || ''),
      panCard: panCard !== undefined ? panCard : (existingDocs.panCard || ''),
      companyLogo: companyLogo !== undefined ? companyLogo : (existingDocs.companyLogo || ''),
    };

    // Update Step 3 details (business profile)
    if (bio !== undefined) updateData.bio = bio;
    if (unitsDelivered !== undefined) updateData.unitsDelivered = unitsDelivered;
    if (isIsoCertified !== undefined) updateData.isIsoCertified = isIsoCertified;

    // If submitForVerification is true, run complete validation
    if (submitForVerification) {
      const finalCompanyName = companyName !== undefined ? companyName : currentUser.companyName;
      const finalReraNumber = reraNumber !== undefined ? reraNumber : currentUser.reraNumber;
      const finalCityOfOperation = cityOfOperation !== undefined ? cityOfOperation : currentUser.cityOfOperation;
      const finalReraCert = reraCertificate !== undefined ? reraCertificate : existingDocs.reraCertificate;
      const finalPanCard = panCard !== undefined ? panCard : existingDocs.panCard;

      if (!finalCompanyName || !finalReraNumber || !finalCityOfOperation) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide company name, RERA registration number, and city of operation.',
        });
      }

      if (!finalReraCert || !finalPanCard) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please upload all required verification documents: RERA certificate and PAN card.',
        });
      }

      updateData.builderVerificationStatus = 'pending';
    } else {
      // Just saving a draft, retain current status or set to 'unverified'
      updateData.builderVerificationStatus = currentUser.builderVerificationStatus || 'unverified';
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    // Notify administrators if submitted for verification
    if (submitForVerification) {
      try {
        const Admin = require('../../models/admin.model');
        const Notification = require('../../models/notification.model');
        const admins = await Admin.find().select('_id');
        if (admins.length > 0) {
          const notificationsData = admins.map((admin) => ({
            recipient: admin._id,
            title: 'New Developer Verification Pending',
            message: `Developer ${user.companyName || user.name} (${user.cityOfOperation || 'India'}) has submitted company documents for review.`,
            type: 'verification',
            isRead: false,
          }));
          await Notification.insertMany(notificationsData);
        }
      } catch (notifErr) {
        console.error('Error creating admin notification for developer registration:', notifErr);
      }
    }

    // Issue fresh JWT token with updated 'builder' role
    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: submitForVerification
        ? 'Developer registration & company documents submitted successfully! Admin will review within 24-48 hours.'
        : 'Developer registration draft saved successfully.',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          companyName: user.companyName,
          phone: user.phone,
          role: user.role,
          reraNumber: user.reraNumber,
          gstNumber: user.gstNumber,
          yearsInBusiness: user.yearsInBusiness,
          cityOfOperation: user.cityOfOperation,
          bio: user.bio,
          unitsDelivered: user.unitsDelivered,
          isIsoCertified: user.isIsoCertified,
          builderDocs: user.builderDocs,
          builderVerificationStatus: user.builderVerificationStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all verified developers / builders (with optional city filter)
// @route   GET /api/users/developers
// @access  Public
exports.getVerifiedDevelopers = async (req, res, next) => {
  try {
    const { city } = req.query;

    const query = {
      role: 'builder',
      builderVerificationStatus: 'approved',
    };

    if (city && city !== 'All India') {
      query.cityOfOperation = { $regex: new RegExp(`^\\s*${city.trim()}\\s*$`, 'i') };
    }

    const developers = await User.find(query).select(
      'name companyName profilePicture builderDocs cityOfOperation yearsInBusiness rating reviewCount'
    );

    // Get project counts for all these developers
    const developerIds = developers.map((d) => d._id);
    const Project = require('../../models/project.model');
    const projectCounts = await Project.aggregate([
      { $match: { developer: { $in: developerIds } } },
      { $group: { _id: '$developer', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    projectCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const formattedDevelopers = developers.map((dev) => {
      const pCount = countMap[dev._id.toString()] || 0;
      return {
        id: dev._id,
        name: dev.name,
        companyName: dev.companyName || dev.name,
        profilePicture: dev.profilePicture || 'default-avatar.png',
        logo: dev.builderDocs?.companyLogo || '',
        cityOfOperation: dev.cityOfOperation || '',
        yearsInBusiness: dev.yearsInBusiness || '',
        rating: dev.rating !== undefined ? dev.rating : 4.5,
        reviewCount: dev.reviewCount !== undefined ? dev.reviewCount : 120,
        projectCount: pCount,
        projectCountDisplay: pCount > 0 ? `${pCount}+ projects` : '0 projects',
      };
    });

    res.status(200).json({
      status: 'success',
      results: formattedDevelopers.length,
      data: {
        developers: formattedDevelopers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed developer / builder profile by ID
// @route   GET /api/users/developers/:id
// @access  Public
exports.getDeveloperProfile = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid developer ID format.',
      });
    }

    const developer = await User.findOne({
      _id: req.params.id,
      role: 'builder',
    });

    if (!developer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Developer profile not found or user is not a developer.',
      });
    }

    const Project = require('../../models/project.model');

    // 1. Get total approved projects count
    const projectsCount = await Project.countDocuments({
      developer: developer._id,
      approvalStatus: 'approved',
    });

    // 2. Get operating cities count (distinct cities from their approved projects)
    const cities = await Project.distinct('city', {
      developer: developer._id,
      approvalStatus: 'approved',
    });
    
    // Fallback to 1 if developer has cityOfOperation specified but no projects yet
    const citiesCount = cities.length > 0 ? cities.length : (developer.cityOfOperation ? 1 : 0);

    res.status(200).json({
      status: 'success',
      data: {
        developer: {
          id: developer._id,
          name: developer.name,
          companyName: developer.companyName || developer.name,
          profilePicture: developer.profilePicture || 'default-avatar.png',
          logo: developer.builderDocs?.companyLogo || '',
          cityOfOperation: developer.cityOfOperation || '',
          yearsInBusiness: developer.yearsInBusiness || '',
          rating: developer.rating !== undefined ? developer.rating : 4.5,
          reviewCount: developer.reviewCount !== undefined ? developer.reviewCount : 120,
          bio: developer.bio || '',
          unitsDelivered: developer.unitsDelivered || '0',
          isIsoCertified: developer.isIsoCertified || false,
          projectsCount,
          citiesCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

