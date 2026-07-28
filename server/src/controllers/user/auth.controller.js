/**
 * App Authentication Controller
 * Manages Mobile OTP Registration, Verification, and Progressive Profile Setup
 */

const User = require('../../models/user.model');
const generateToken = require('../../utils/generateToken');

// Helper to normalize phone numbers (+91XXXXXXXXXX, 9876543210, +91 98765 43210 -> +919876543210)
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

// Token generated using imported utility

// In-memory temporary store for OTPs & pending registration drafts (phone -> { otp, registrationData, expiresAt })
const otpStore = new Map();

// @desc    Step 1 of Auth: Submit Basic Info & Send OTP (Screen 1: Basic Info)
// @route   POST /api/user/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, address, latitude, longitude } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide full name and phone number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if phone or email already registered
    const searchConditions = [{ phone: normalizedPhone }];
    if (email) searchConditions.push({ email });

    const existingUser = await User.findOne({ $or: searchConditions });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this phone number or email already exists. Please log in.',
      });
    }

    // Build address object
    let addressObj;
    if (typeof address === 'string') {
      addressObj = { formattedAddress: address };
    } else if (typeof address === 'object') {
      addressObj = address;
    }

    // Build location coordinates
    let locationObj;
    if (latitude && longitude) {
      locationObj = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save registration draft & OTP in memory under normalized phone
    otpStore.set(normalizedPhone, {
      otp: generatedOtp,
      registrationData: {
        name,
        email,
        phone: normalizedPhone,
        address: addressObj,
        location: locationObj,
        authProvider: 'mobile',
      },
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Log OTP prominently in backend terminal
    console.log(`\n==================================================`);
    console.log(`📱 [NEW USER REGISTRATION OTP]`);
    console.log(`   Name          : ${name}`);
    console.log(`   Input Phone   : ${phone}`);
    console.log(`   Normalized    : ${normalizedPhone}`);
    console.log(`   🔑 GENERATED OTP : ${generatedOtp}`);
    console.log(`==================================================\n`);

    res.status(200).json({
      status: 'success',
      message: `OTP sent successfully to ${normalizedPhone}. Check backend terminal for OTP log.`,
      phone: normalizedPhone,
      otp: generatedOtp, // Returned for dev testing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP for existing user sign-in
// @route   POST /api/user/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide mobile number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    const existingUser = await User.findOne({ phone: normalizedPhone });

    if (!existingUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'No account found with this mobile number. Please click "Create an Account" to register first.',
      });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(normalizedPhone, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(`\n==================================================`);
    console.log(`📱 [SIGN-IN MOBILE OTP SENT]`);
    console.log(`   User Name     : ${existingUser.name}`);
    console.log(`   Input Phone   : ${phone}`);
    console.log(`   Normalized    : ${normalizedPhone}`);
    console.log(`   🔑 GENERATED OTP : ${generatedOtp}`);
    console.log(`==================================================\n`);

    res.status(200).json({
      status: 'success',
      isRegistered: true,
      message: `OTP sent successfully to ${normalizedPhone} for Sign In.`,
      phone: normalizedPhone,
      otp: generatedOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP to mobile number
// @route   POST /api/user/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide mobile number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Retrieve existing draft registration data if present
    const existingEntry = otpStore.get(normalizedPhone);
    const registrationData = existingEntry ? existingEntry.registrationData : undefined;

    // Generate fresh 6-digit OTP
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(normalizedPhone, {
      otp: freshOtp,
      registrationData,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(`\n==================================================`);
    console.log(`🔄 [RESEND MOBILE OTP]`);
    console.log(`   Input Phone   : ${phone}`);
    console.log(`   Normalized    : ${normalizedPhone}`);
    console.log(`   🔑 FRESH RESENT OTP : ${freshOtp}`);
    console.log(`==================================================\n`);

    res.status(200).json({
      status: 'success',
      message: `OTP resent successfully to ${normalizedPhone}. Check backend terminal for OTP log.`,
      phone: normalizedPhone,
      otp: freshOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Step 2 of Auth: Verify OTP & Create User / Session (Screen 2: Verify Your Number)
// @route   POST /api/user/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide phone and OTP.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    const storedData = otpStore.get(normalizedPhone);

    // Verify OTP against terminal-printed OTP or fallback '123456' in dev
    const isValidOtp =
      (storedData && storedData.otp === otp && Date.now() < storedData.expiresAt) ||
      otp === '123456';

    if (!isValidOtp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP. Please request a new OTP.',
      });
    }

    let user = await User.findOne({ phone: normalizedPhone });

    // If new user registration draft exists in memory, create user now!
    if (!user && storedData && storedData.registrationData) {
      user = await User.create(storedData.registrationData);
    }

    // Clean up stored OTP
    if (storedData) otpStore.delete(normalizedPhone);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found. Please complete Basic Info registration first.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role, // Undefined initially until user selects on Screen 3
          address: user.address,
          location: user.location,
          isOnboardingCompleted: user.isOnboardingCompleted || false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Progressive Profile Update (Screens 3, 4, 5: Role, Intents, Preferences)
// @route   PATCH /api/user/auth/register OR /api/user/auth/update-profile
// @access  Private (Authenticated User)
exports.updateProfile = async (req, res, next) => {
  try {
    const { role, intents, preferences, notificationSettings } = req.body;

    const updateData = {};

    if (role) updateData.role = role;
    if (intents) updateData.intents = intents;
    if (preferences) updateData.preferences = preferences;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;

    // Mark onboarding completed if preferences or role set
    if (preferences || (role && intents)) {
      updateData.isOnboardingCompleted = true;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
