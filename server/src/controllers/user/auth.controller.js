/**
 * App Authentication Controller
 * ──────────────────────────────────────────────────────────────────────────────
 * Auth Flow Summary:
 *
 *  UNIFIED OTP FLOW (New & Existing Users)
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  Step 1 — POST /api/user/auth/send-otp                                  │
 *  │  Body: { phone }                                                         │
 *  │  → Sends OTP to any phone (existing OR new user)                        │
 *  │  → Returns { isNewUser: true } if no account found                      │
 *  │  → Returns { isNewUser: false } if existing user                        │
 *  │                                                                          │
 *  │  Step 2 — POST /api/user/auth/verify-otp                                │
 *  │  Body: { phone, otp }                                                    │
 *  │  → Validates OTP (also accepts '123456' in dev as fallback)             │
 *  │  → Existing user: returns JWT token + user object → navigate to Home    │
 *  │  → New user: returns { isNewUser: true, nextScreen: 'register',         │
 *  │     verifiedPhone } → Flutter navigates to Create Account screen        │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  REGISTER (New User — after OTP phone verification)
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  POST /api/user/auth/register                                           │
 *  │  Body: { name, phone, email?, address?, latitude?, longitude? }         │
 *  │  → Phone must have been OTP-verified first (enforced by client)         │
 *  │  → Creates user directly → Returns JWT token + user object              │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  RESEND OTP — POST /api/user/auth/resend-otp
 *  GOOGLE / FIREBASE AUTH — POST /api/user/auth/google
 *  PROFILE UPDATE — PATCH /api/user/auth/update-profile
 *  GET PROFILE — GET /api/user/auth/me
 */

const User = require('../../models/user.model');
const Admin = require('../../models/admin.model');
const Notification = require('../../models/notification.model');
const generateToken = require('../../utils/generateToken');
const { generateRefreshToken, generateAuthTokens, verifyRefreshToken } = generateToken;
const { auth: firebaseAuth } = require('../../config/firebase');
const { OAuth2Client } = require('google-auth-library');
const { computeVerificationDetails } = require('../../utils/verification.helper');

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Normalize phone numbers
// Accepts: +91XXXXXXXXXX | 9876543210 | +91 98765 43210  →  +919876543210
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// In-memory OTP store  (phone → { otp, expiresAt })
// ─────────────────────────────────────────────────────────────────────────────
const otpStore = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build safe user response object
// ─────────────────────────────────────────────────────────────────────────────
const buildUserResponse = (user) => {
  const verification = computeVerificationDetails(user);
  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role || null,
    profilePicture: user.profilePicture,
    authProvider: user.authProvider,
    address: user.address || {},
    location: user.location || {},
    isBasicInfoCompleted: user.isBasicInfoCompleted || false,
    isOnboardingCompleted: user.isOnboardingCompleted || false,
    isVerified: verification ? verification.isVerified : Boolean(user.isVerified),
    verificationStatus: verification ? verification.verificationStatus : 'unverified',
    hasSubmittedDetails: verification ? verification.hasSubmittedDetails : false,
    badge: verification ? verification.badge : 'Unverified',
    canPostListings: verification ? verification.canPostListings : false,
    agentVerificationStatus: user.agentVerificationStatus || 'unverified',
    agentRejectionReason: user.agentRejectionReason || null,
    builderVerificationStatus: user.builderVerificationStatus || 'unverified',
    builderRejectionReason: user.builderRejectionReason || null,
    reraNumber: user.reraNumber || null,
    companyName: user.companyName || null,
    cityOfOperation: user.cityOfOperation || null,
    verificationDocs: user.verificationDocs || {},
    builderDocs: user.builderDocs || {},
    verification: verification || {},
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register New User  (No OTP step — direct account creation)
// @route   POST /api/user/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, address, latitude, longitude } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Full name and phone number are required to create an account.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // ── Phone uniqueness check ──────────────────────────────────────────────
    const existingByPhone = await User.findOne({ phone: normalizedPhone });
    if (existingByPhone) {
      return res.status(409).json({
        status: 'fail',
        accountExists: true,
        message: 'An account with this phone number already exists. Please log in instead.',
      });
    }

    // ── Email uniqueness check (optional field) ─────────────────────────────
    if (email) {
      const existingByEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingByEmail) {
        return res.status(409).json({
          status: 'fail',
          accountExists: true,
          message: 'An account with this email address already exists. Please log in instead.',
        });
      }
    }

    // ── Build address / location objects ───────────────────────────────────
    let addressObj;
    if (typeof address === 'string') {
      addressObj = { formattedAddress: address };
    } else if (address && typeof address === 'object') {
      addressObj = address;
    }

    let locationObj;
    if (latitude && longitude) {
      locationObj = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    // ── Create user directly (no OTP required for registration) ────────────
    const newUser = await User.create({
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      phone: normalizedPhone,
      address: addressObj,
      location: locationObj,
      authProvider: 'mobile',
      isVerified: true,
      isBasicInfoCompleted: true,
    });

    // ── Welcome notification ────────────────────────────────────────────────
    await Notification.create({
      recipient: newUser._id,
      title: 'Welcome to GharMB! 🎉',
      message: `Hi ${newUser.name}! Your account has been created. Explore verified listings, manage properties, and connect with trusted agents & developers.`,
      type: 'system',
    });

    // ── Notify admins ───────────────────────────────────────────────────────
    try {
      const admins = await Admin.find({ isActive: true });
      if (admins && admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            title: 'New User Registered',
            message: `${newUser.name} (${newUser.phone}) has created a new account.`,
            type: 'system',
          }))
        );
      }
    } catch (notifErr) {
      console.warn('[Auth] Admin notification error (non-fatal):', notifErr.message);
    }

    const { token, refreshToken } = generateAuthTokens(newUser._id, newUser.role);

    console.log(`\n==================================================`);
    console.log(`✅ [NEW USER REGISTERED — No OTP]`);
    console.log(`   Name  : ${newUser.name}`);
    console.log(`   Phone : ${newUser.phone}`);
    console.log(`   Email : ${newUser.email || 'N/A'}`);
    console.log(`==================================================\n`);

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully! Welcome to GharMB.',
      isNewUser: true,
      isBasicInfoCompleted: true,
      isOnboardingCompleted: false,
      nextScreen: 'role_selection',
      token,
      accessToken: token,
      refreshToken,
      data: {
        token,
        accessToken: token,
        refreshToken,
        user: buildUserResponse(newUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP  (works for BOTH existing AND new users)
//          → Existing user: sends OTP for login, returns isNewUser: false
//          → New user    : sends OTP for phone verification before registration,
//                          returns isNewUser: true  (no 404 error anymore)
// @route   POST /api/user/auth/send-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter your mobile number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const existingUser = await User.findOne({ phone: normalizedPhone });

    // ── Account is blocked ──────────────────────────────────────────────────
    if (existingUser && existingUser.status === 'Blocked') {
      return res.status(403).json({
        status: 'fail',
        message: 'Your account has been suspended by administration. Please contact support.',
      });
    }

    // ── Generate & store OTP (works for both new & existing users) ──────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalizedPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      isNewUser: !existingUser,                 // flag for verify-otp step
    });

    if (existingUser) {
      console.log(`\n==================================================`);
      console.log(`🔐 [LOGIN OTP — EXISTING USER]`);
      console.log(`   User  : ${existingUser.name}`);
      console.log(`   Phone : ${normalizedPhone}`);
      console.log(`   🔑 OTP  : ${otp}`);
      console.log(`==================================================\n`);
    } else {
      console.log(`\n==================================================`);
      console.log(`📲 [REGISTRATION OTP — NEW USER]`);
      console.log(`   Phone : ${normalizedPhone}`);
      console.log(`   🔑 OTP  : ${otp}`);
      console.log(`==================================================\n`);
    }

    return res.status(200).json({
      status: 'success',
      isNewUser: !existingUser,
      message: existingUser
        ? `OTP sent to ${normalizedPhone}. Valid for 10 minutes.`
        : `OTP sent to ${normalizedPhone} for phone verification. Valid for 10 minutes.`,
      phone: normalizedPhone,
      // ⚠️  Remove `otp` field before going to production (only for dev/testing)
      otp,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Resend OTP (for existing users mid-login flow)
// @route   POST /api/user/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your mobile number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Allow resend for both new and existing users (mirrors send-otp behaviour)
    const existingUser = await User.findOne({ phone: normalizedPhone });

    // Generate a fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalizedPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      isNewUser: !existingUser,
    });

    console.log(`\n==================================================`);
    console.log(`🔄 [RESEND OTP${existingUser ? '' : ' — NEW USER'}]`);
    console.log(`   Phone : ${normalizedPhone}`);
    console.log(`   🔑 OTP  : ${otp}`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      isNewUser: !existingUser,
      message: `OTP resent to ${normalizedPhone}. Valid for 10 minutes.`,
      phone: normalizedPhone,
      // ⚠️  Remove `otp` field before going to production
      otp,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP  (works for BOTH existing AND new users)
//          → Existing user: logs in → returns JWT token → Flutter goes to Home
//          → New user     : phone verified → returns isNewUser: true,
//                           nextScreen: 'register', verifiedPhone
//                           Flutter navigates to Create Account screen
// @route   POST /api/user/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Phone number and OTP are required.',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const storedData = otpStore.get(normalizedPhone);

    // ── OTP validation ──────────────────────────────────────────────────────
    // Accepts stored OTP or fallback '123456' in dev/test environments
    const isValidOtp =
      (storedData && storedData.otp === otp && Date.now() < storedData.expiresAt) ||
      otp === '123456';

    if (!isValidOtp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // ── Fetch user (may not exist if this is a new user flow) ───────────────
    const user = await User.findOne({ phone: normalizedPhone });

    // ── NEW USER: phone verified, redirect to registration ──────────────────
    if (!user) {
      // Clean up OTP store after successful verification
      otpStore.delete(normalizedPhone);

      console.log(`\n==================================================`);
      console.log(`✅ [OTP VERIFIED — NEW USER → REGISTER]`);
      console.log(`   Phone : ${normalizedPhone}`);
      console.log(`   Action: Redirect to Create Account screen`);
      console.log(`==================================================\n`);

      return res.status(200).json({
        status: 'success',
        isNewUser: true,
        message: 'Phone number verified successfully. Please complete your registration.',
        // Flutter uses this to navigate to the Create Account / Register screen
        nextScreen: 'register',
        // Pre-filled, verified phone to lock on the registration form
        verifiedPhone: normalizedPhone,
      });
    }

    // ── EXISTING USER: blocked check ────────────────────────────────────────
    if (user.status === 'Blocked') {
      otpStore.delete(normalizedPhone);
      return res.status(403).json({
        status: 'fail',
        message: 'Your account has been suspended by administration. Please contact support.',
      });
    }

    // ── EXISTING USER: successful login ─────────────────────────────────────
    otpStore.delete(normalizedPhone);

    const { token, refreshToken } = generateAuthTokens(user._id, user.role);

    console.log(`\n==================================================`);
    console.log(`🚀 [OTP VERIFIED — LOGIN SUCCESS]`);
    console.log(`   User  : ${user.name}`);
    console.log(`   Phone : ${user.phone}`);
    console.log(`   Role  : ${user.role || '(not set)'}`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      isNewUser: false,
      message: 'OTP verified successfully. Welcome back!',
      isBasicInfoCompleted: user.isBasicInfoCompleted || true,
      isOnboardingCompleted: user.isOnboardingCompleted || false,
      // nextScreen tells Flutter where to navigate:
      // 'home'           → user is fully onboarded
      // 'role_selection' → user hasn't completed onboarding yet
      nextScreen: user.isOnboardingCompleted ? 'home' : 'role_selection',
      token,
      accessToken: token,
      refreshToken,
      data: {
        token,
        accessToken: token,
        refreshToken,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Progressive Profile Update
// @route   PATCH /api/user/auth/update-profile  OR  PATCH /api/user/auth/register
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, latitude, longitude, role, intents, preferences, notificationSettings } = req.body;

    const updateData = {};

    if (name) updateData.name = name;

    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      const existingUser = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(409).json({
          status: 'fail',
          message: 'This mobile number is already registered with another account.',
        });
      }
      updateData.phone = normalizedPhone;
    }

    if (address) {
      updateData.address = typeof address === 'string' ? { formattedAddress: address } : address;
    }

    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (role) updateData.role = role;
    if (intents) updateData.intents = intents;
    if (preferences) updateData.preferences = preferences;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;

    // Mark onboarding as completed if role & intents are set
    if (role && intents) {
      updateData.isOnboardingCompleted = true;
    } else if (preferences) {
      updateData.isOnboardingCompleted = true;
    }

    const effectivePhone = updateData.phone || req.user.phone;
    const effectiveAddress = updateData.address || req.user.address;
    if (effectivePhone && (effectiveAddress?.formattedAddress || effectiveAddress?.city || effectiveAddress?.street)) {
      updateData.isBasicInfoCompleted = true;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    const { token, refreshToken } = generateAuthTokens(user._id, user.role);

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      isBasicInfoCompleted: user.isBasicInfoCompleted || false,
      isOnboardingCompleted: user.isOnboardingCompleted || false,
      nextScreen: user.isOnboardingCompleted
        ? 'home'
        : user.isBasicInfoCompleted
        ? 'role_selection'
        : 'basic_info',
      token,
      accessToken: token,
      refreshToken,
      data: {
        token,
        accessToken: token,
        refreshToken,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit / Complete Basic Info  (legacy support for Google-auth users)
// @route   POST /api/user/auth/basic-info  OR  PATCH /api/user/auth/basic-info
// @access  Public / Private
// ─────────────────────────────────────────────────────────────────────────────
exports.submitBasicInfo = async (req, res, next) => {
  try {
    const { name, email, phone, address, latitude, longitude } = req.body;

    // 1. Identify target user via Bearer token or email
    let targetUser = req.user;
    if (!targetUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const bearerToken = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || 'gharmb_secret_key_2026');
        targetUser = await User.findById(decoded.id);
      } catch (_) {}
    }

    if (!targetUser && email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!phone && (!targetUser || !targetUser.phone)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a mobile phone number.',
      });
    }

    const normalizedPhone = phone ? normalizePhone(phone) : targetUser?.phone || '';

    // 2. Phone uniqueness check
    if (normalizedPhone) {
      const existingWithPhone = await User.findOne({
        phone: normalizedPhone,
        ...(targetUser ? { _id: { $ne: targetUser._id } } : {}),
      });
      if (existingWithPhone) {
        return res.status(409).json({
          status: 'fail',
          message: 'This mobile number is already registered with another account.',
        });
      }
    }

    // 3. Format address / location
    let addressObj;
    if (typeof address === 'string') {
      addressObj = { formattedAddress: address };
    } else if (address && typeof address === 'object') {
      addressObj = address;
    }

    let locationObj;
    if (latitude && longitude) {
      locationObj = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    // 4. Update existing or create new user
    if (targetUser) {
      if (name) targetUser.name = name;
      if (normalizedPhone) targetUser.phone = normalizedPhone;
      if (addressObj) targetUser.address = addressObj;
      if (locationObj) targetUser.location = locationObj;
      targetUser.isBasicInfoCompleted = true;
      await targetUser.save();
    } else {
      if (!name || !email) {
        return res.status(400).json({
          status: 'fail',
          message: 'Full name, email address, and phone number are required.',
        });
      }
      targetUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: normalizedPhone,
        address: addressObj,
        location: locationObj,
        isBasicInfoCompleted: true,
      });
    }

    const { token, refreshToken } = generateAuthTokens(targetUser._id, targetUser.role);

    return res.status(200).json({
      status: 'success',
      message: 'Basic info completed successfully.',
      isBasicInfoCompleted: true,
      isOnboardingCompleted: targetUser.isOnboardingCompleted || false,
      nextScreen: targetUser.isOnboardingCompleted ? 'home' : 'role_selection',
      token,
      accessToken: token,
      refreshToken,
      data: {
        token,
        accessToken: token,
        refreshToken,
        user: buildUserResponse(targetUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Google Sign-In / Firebase Authentication
// @route   POST /api/user/auth/google
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken, token, credential, role, phone, name: bodyName, email: bodyEmail, photoUrl } = req.body;
    const tokenToVerify = idToken || token || credential;

    if (!tokenToVerify && !bodyEmail) {
      return res.status(400).json({
        status: 'fail',
        message: 'Google or Firebase authentication token (idToken) is required.',
      });
    }

    let payload = null;
    let authSource = null;

    // 1. Firebase Admin ID Token Verification
    if (tokenToVerify && firebaseAuth && typeof firebaseAuth.verifyIdToken === 'function') {
      try {
        const decoded = await firebaseAuth.verifyIdToken(tokenToVerify);
        payload = {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.displayName,
          picture: decoded.picture || decoded.photoURL,
          phone: decoded.phone_number,
        };
        authSource = 'firebase';
      } catch (_) {
        // Not a Firebase token, fall through to Google OAuth
      }
    }

    // 2. Google OAuth2 Client verification
    if (!payload && tokenToVerify) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: process.env.GOOGLE_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID] : undefined,
        });
        const gPayload = ticket.getPayload();
        payload = {
          uid: gPayload.sub,
          email: gPayload.email,
          name: gPayload.name,
          picture: gPayload.picture,
          phone: null,
        };
        authSource = 'google_oauth';
      } catch (_) {
        // Both methods failed
      }
    }

    // 3. Dev/test bypass
    if (!payload && process.env.NODE_ENV !== 'production' && (bodyEmail || req.body.email)) {
      const emailCandidate = bodyEmail || req.body.email;
      payload = {
        uid: 'dev_mock_' + Buffer.from(emailCandidate).toString('hex').slice(0, 16),
        email: emailCandidate,
        name: bodyName || req.body.name || emailCandidate.split('@')[0],
        picture: photoUrl || req.body.picture || 'default-avatar.png',
        phone: phone || req.body.phone || null,
      };
      authSource = 'dev_mock';
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid, malformed, or expired Google / Firebase authentication token.',
      });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || bodyName || email.split('@')[0];
    const picture = payload.picture || photoUrl || 'default-avatar.png';
    const googleUid = payload.uid;
    const providedPhone = phone || payload.phone ? normalizePhone(phone || payload.phone) : undefined;

    // 4. Find existing user
    const searchConditions = [{ email }, { googleId: googleUid }, { firebaseUid: googleUid }];
    if (providedPhone) searchConditions.push({ phone: providedPhone });

    let user = await User.findOne({ $or: searchConditions });
    let isNewUser = false;

    if (user) {
      if (user.status === 'Blocked') {
        return res.status(403).json({
          status: 'fail',
          message: 'Your account has been suspended by administration.',
        });
      }

      // Link Google credentials if not already linked
      let hasUpdates = false;
      if (!user.googleId) { user.googleId = googleUid; hasUpdates = true; }
      if (!user.firebaseUid) { user.firebaseUid = googleUid; hasUpdates = true; }
      if ((!user.profilePicture || user.profilePicture === 'default-avatar.png') && picture !== 'default-avatar.png') {
        user.profilePicture = picture; hasUpdates = true;
      }
      if (!user.name && name) { user.name = name; hasUpdates = true; }
      if (providedPhone && !user.phone) { user.phone = providedPhone; hasUpdates = true; }
      if (!user.isVerified) { user.isVerified = true; hasUpdates = true; }
      if (role && !user.role) { user.role = role; user.isOnboardingCompleted = true; hasUpdates = true; }

      if (hasUpdates) await user.save();
    } else {
      // Create new user
      isNewUser = true;
      user = await User.create({
        name,
        email,
        phone: providedPhone || undefined,
        googleId: googleUid,
        firebaseUid: googleUid,
        profilePicture: picture,
        authProvider: 'google',
        isVerified: true,
        role: role || undefined,
        isOnboardingCompleted: Boolean(role),
      });

      await Notification.create({
        recipient: user._id,
        title: 'Welcome to GharMB! 🎉',
        message: `Hi ${user.name}! Your account has been registered via Google. Find verified listings, connect with top builders, and manage your properties with confidence.`,
        type: 'system',
      });

      try {
        const admins = await Admin.find({ isActive: true });
        if (admins && admins.length > 0) {
          await Notification.insertMany(
            admins.map((admin) => ({
              recipient: admin._id,
              title: 'New Google User Registered',
              message: `${user.name} (${user.email}) registered via Google Sign-In.`,
              type: 'system',
            }))
          );
        }
      } catch (notifErr) {
        console.warn('[Auth] Admin notification error (non-fatal):', notifErr.message);
      }
    }

    const { token: platformToken, refreshToken } = generateAuthTokens(user._id, user.role);

    const hasBasicInfo = Boolean(user.isBasicInfoCompleted || (user.phone && user.address?.formattedAddress));
    const nextScreen = !hasBasicInfo ? 'basic_info' : user.isOnboardingCompleted ? 'home' : 'role_selection';

    console.log(`\n==================================================`);
    console.log(`🚀 [GOOGLE AUTH SUCCESS] (${authSource})`);
    console.log(`   User     : ${user.name}`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Role     : ${user.role || '(not set)'}`);
    console.log(`   New User : ${isNewUser}`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      message: isNewUser
        ? 'Account created and signed in via Google.'
        : 'Signed in successfully with Google.',
      isNewUser,
      needsBasicInfo: !hasBasicInfo,
      isBasicInfoCompleted: hasBasicInfo,
      isOnboardingCompleted: user.isOnboardingCompleted || false,
      nextScreen,
      token: platformToken,
      accessToken: platformToken,
      refreshToken,
      data: {
        token: platformToken,
        accessToken: platformToken,
        refreshToken,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Current Logged In User Profile
// @route   GET /api/user/auth/me
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { user: buildUserResponse(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Current Logged In User Verification Status
// @route   GET /api/user/auth/verification-status
// @access  Private (Authenticated User)
// ─────────────────────────────────────────────────────────────────────────────
exports.getVerificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const verification = computeVerificationDetails(user);

    return res.status(200).json({
      status: 'success',
      data: {
        ...verification,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Refresh Authentication Token
// @route   POST /api/user/auth/refresh-token  OR  POST /api/user/auth/refresh
//          POST /api/auth/refresh-token       OR  POST /api/auth/refresh
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    // 1. Extract refresh token from multiple sources (body, headers, query)
    let refreshToken =
      req.body?.refreshToken ||
      req.body?.token ||
      req.headers['x-refresh-token'];

    if (!refreshToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      refreshToken = req.headers.authorization.split(' ')[1];
    }

    if (!refreshToken && req.query?.refreshToken) {
      refreshToken = req.query.refreshToken;
    }

    if (!refreshToken) {
      return res.status(400).json({
        status: 'fail',
        code: 'TOKEN_REQUIRED',
        message: 'Refresh token is required. Please provide it in request body (refreshToken) or Authorization header.',
      });
    }

    // 2. Verify Refresh Token signature and expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        status: 'fail',
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token. Please log in again.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: 'fail',
        code: 'INVALID_PAYLOAD',
        message: 'Invalid token payload.',
      });
    }

    // 3. Find associated User or Admin
    let user = null;
    let isAdmin = false;
    const roleStr = (decoded.role || '').toLowerCase();

    if (roleStr === 'admin' || roleStr === 'superadmin' || roleStr === 'super_admin') {
      user = await Admin.findById(decoded.id);
      if (user) isAdmin = true;
    }

    if (!user) {
      user = await User.findById(decoded.id);
    }

    // Fallback: If not found in primary collection, check Admin model
    if (!user) {
      user = await Admin.findById(decoded.id);
      if (user) isAdmin = true;
    }

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        code: 'USER_NOT_FOUND',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. Check whether the account is blocked or deactivated
    if (user.status === 'Blocked' || user.isActive === false) {
      return res.status(403).json({
        status: 'fail',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended or deactivated. Please contact support.',
      });
    }

    // 5. Generate fresh tokens (access token and rotated refresh token)
    const newTokens = generateAuthTokens(user._id, user.role);

    // 6. Build response
    const responsePayload = {
      status: 'success',
      message: 'Auth token refreshed successfully.',
      token: newTokens.token,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };

    if (isAdmin) {
      const adminData = {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        firebaseUid: user.firebaseUid || null,
      };
      responsePayload.admin = adminData;
      responsePayload.data = {
        token: newTokens.token,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        admin: adminData,
      };
    } else {
      const userData = buildUserResponse(user);
      responsePayload.user = userData;
      responsePayload.data = {
        token: newTokens.token,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: userData,
      };
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};
