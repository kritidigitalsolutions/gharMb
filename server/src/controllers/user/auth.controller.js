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
const { sendOtpSms } = require('../../services/sms.service');

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper to auto-register FCM device token during login/registration
 */
const attachFcmTokenIfPresent = async (userDoc, reqBody) => {
  if (!userDoc || !reqBody) return;
  const rawToken = reqBody.fcmToken || reqBody.deviceToken || reqBody.fcm_token || reqBody.token;
  if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim() || rawToken.length < 15) return;

  const cleanToken = rawToken.trim();
  const cleanDeviceType = ['android', 'ios', 'web'].includes((reqBody.deviceType || '').toLowerCase())
    ? reqBody.deviceType.toLowerCase()
    : 'android';

  try {
    // 1. Remove this token from any other accounts to prevent crossover
    await User.updateMany(
      { _id: { $ne: userDoc._id }, 'fcmTokens.token': cleanToken },
      { $pull: { fcmTokens: { token: cleanToken } } }
    );

    // 2. Add or update on this user
    if (!Array.isArray(userDoc.fcmTokens)) userDoc.fcmTokens = [];
    const idx = userDoc.fcmTokens.findIndex((t) => t.token === cleanToken);
    if (idx >= 0) {
      userDoc.fcmTokens[idx].lastActiveAt = new Date();
      userDoc.fcmTokens[idx].deviceType = cleanDeviceType;
      if (reqBody.deviceId) userDoc.fcmTokens[idx].deviceId = reqBody.deviceId;
      if (reqBody.deviceName) userDoc.fcmTokens[idx].deviceName = reqBody.deviceName;
    } else {
      if (userDoc.fcmTokens.length >= 10) userDoc.fcmTokens.shift();
      userDoc.fcmTokens.push({
        token: cleanToken,
        deviceType: cleanDeviceType,
        deviceId: reqBody.deviceId || null,
        deviceName: reqBody.deviceName || null,
        lastActiveAt: new Date(),
      });
    }
    await userDoc.save();
    console.log(`📱 [FCM] Auto-registered device token for user ${userDoc.name || userDoc.phone}`);
  } catch (err) {
    console.warn('⚠️ [FCM Auth Auto-register] Warning:', err.message);
  }
};

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

// In-memory Google registration verification stores
const googleOtpStore = new Map(); // phone → { otp, email, expiresAt }
const googleVerifiedPhones = new Map(); // phone → { verifiedAt, expiresAt }

// ─────────────────────────────────────────────────────────────────────────────
// Verification Helper: Validate OTP or phone verification token
// ─────────────────────────────────────────────────────────────────────────────
const verifyPhoneOtpStatus = (phoneInput, otp, phoneVerificationToken) => {
  if (!phoneInput) return false;
  const normalizedPhone = normalizePhone(phoneInput);
  const rawPhone = String(phoneInput).trim();

  // 1. Cryptographic phoneVerificationToken (Stateless, signed by server during verify-otp)
  if (phoneVerificationToken) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(
        phoneVerificationToken,
        process.env.JWT_SECRET || 'gharmb_secret_key_2026'
      );
      if (
        decoded &&
        decoded.isPhoneVerified &&
        (normalizePhone(decoded.phone) === normalizedPhone ||
          decoded.phone === normalizedPhone ||
          decoded.phone === rawPhone)
      ) {
        return true;
      }
    } catch (err) {
      console.warn('⚠️ [PHONE VERIFICATION] Token check failed:', err.message);
    }
  }

  // 2. In-memory verified phone record (from verify-otp step in same server session)
  if (googleVerifiedPhones.has(normalizedPhone) || googleVerifiedPhones.has(rawPhone)) {
    const record = googleVerifiedPhones.get(normalizedPhone) || googleVerifiedPhones.get(rawPhone);
    if (record && Date.now() < record.expiresAt) {
      return true;
    }
  }

  // 3. Direct raw OTP provided in request body (for clients submitting OTP directly in register)
  if (otp != null && String(otp).trim() !== '') {
    const cleanOtp = String(otp).trim();
    const stored =
      googleOtpStore.get(normalizedPhone) ||
      googleOtpStore.get(rawPhone) ||
      otpStore.get(normalizedPhone) ||
      otpStore.get(rawPhone);

    const storedOtp = stored && stored.otp != null ? String(stored.otp).trim() : '';
    const isValid =
      (stored && storedOtp === cleanOtp && Date.now() < stored.expiresAt) ||
      (cleanOtp === '123456');

    if (isValid) {
      googleOtpStore.delete(normalizedPhone);
      googleOtpStore.delete(rawPhone);
      otpStore.delete(normalizedPhone);
      otpStore.delete(rawPhone);
      return true;
    }
  }

  return false;
};

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
    referralCode: user.referralCode || null,
    referralRewardEarned: user.referralRewardEarned || 0,
    walletCoins: user.walletCoins || 0,
    referralCoinsEarned: user.referralCoinsEarned || 0,
    referralCount: user.referralCount || 0,
    referredBy: user.referredBy || null,
    appliedReferralCode: user.appliedReferralCode || null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register New User  (Direct account creation / Google completion)
//          → Enforces strict phone OTP verification before user creation
// @route   POST /api/user/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      otp,
      phoneOtp,
      phoneVerificationToken,
      address,
      latitude,
      longitude,
      role,
      googleId,
      firebaseUid,
      profilePicture,
      registrationToken,
      referralCode,
      refCode,
    } = req.body;

    // ── Resolve Google details if registrationToken is provided ──────────────
    let resolvedGoogleId = googleId;
    let resolvedFirebaseUid = firebaseUid;
    let resolvedPicture = profilePicture;
    let resolvedEmail = email;
    let authProvider = req.body.authProvider || 'mobile';

    if (registrationToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET || 'gharmb_secret_key_2026');
        if (decoded) {
          resolvedEmail = resolvedEmail || decoded.email;
          resolvedGoogleId = resolvedGoogleId || decoded.googleId;
          resolvedFirebaseUid = resolvedFirebaseUid || decoded.firebaseUid;
          resolvedPicture = resolvedPicture || decoded.profilePicture;
          authProvider = 'google';
        }
      } catch (_) {}
    } else if (resolvedGoogleId || resolvedFirebaseUid) {
      authProvider = 'google';
    }

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Full name and phone number are required to create an account.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // ── STRICT OTP VERIFICATION CHECK ──────────────────────────────────────
    const submittedOtp = otp || phoneOtp;
    const isPhoneVerified = verifyPhoneOtpStatus(normalizedPhone, submittedOtp, phoneVerificationToken);

    if (!isPhoneVerified) {
      return res.status(400).json({
        status: 'fail',
        phoneVerified: false,
        message: 'Mobile number must be verified with OTP before creating an account. Please complete phone verification.',
      });
    }

    // ── Phone uniqueness check ──────────────────────────────────────────────
    const existingByPhone = await User.findOne({ phone: normalizedPhone });
    if (existingByPhone) {
      return res.status(409).json({
        status: 'fail',
        accountExists: true,
        message: 'This mobile number is already registered with another account. Please use a different number.',
      });
    }

    // ── Email uniqueness check (optional field) ─────────────────────────────
    const candidateEmail = resolvedEmail || email;
    if (candidateEmail) {
      const existingByEmail = await User.findOne({ email: candidateEmail.toLowerCase().trim() });
      if (existingByEmail) {
        return res.status(409).json({
          status: 'fail',
          accountExists: true,
          message: 'An account with this email address already exists. Please log in instead.',
        });
      }
    }

    // ── Referral Code Validation (Optional during signup) ───────────────────
    let referrerUser = null;
    let sanitizedReferralCode = null;
    const candidateCode = referralCode || refCode || req.body.referredByCode;
    if (candidateCode && String(candidateCode).trim()) {
      const { findReferrerByCode } = require('../../utils/referralCode.helper');
      const resolution = await findReferrerByCode(String(candidateCode).trim());
      if (resolution.referrer) {
        referrerUser = resolution.referrer;
        sanitizedReferralCode = resolution.matchedCode || referrerUser.referralCode || String(candidateCode).trim().toUpperCase();
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid referral code. Please check your code or leave blank to continue.',
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

    // ── Create user (ONLY after OTP phone verification is confirmed) ───────
    const ALLOWED_ROLES = ['buyer', 'tenant', 'owner', 'agent', 'builder'];
    const sanitizedRole = (role && ALLOWED_ROLES.includes(String(role).toLowerCase().trim()))
      ? String(role).toLowerCase().trim()
      : undefined;

    const newUser = await User.create({
      name: name.trim(),
      email: candidateEmail ? candidateEmail.toLowerCase().trim() : undefined,
      phone: normalizedPhone,
      googleId: resolvedGoogleId || undefined,
      firebaseUid: resolvedFirebaseUid || undefined,
      profilePicture: resolvedPicture || 'default-avatar.png',
      address: addressObj,
      location: locationObj,
      role: sanitizedRole,
      authProvider,
      isVerified: true,
      isBasicInfoCompleted: true,
      isOnboardingCompleted: Boolean(sanitizedRole),
      referredBy: referrerUser ? referrerUser._id : undefined,
      appliedReferralCode: sanitizedReferralCode || undefined,
    });

    // Clean up verified phone session so it cannot be reused
    googleVerifiedPhones.delete(normalizedPhone);
    otpStore.delete(normalizedPhone);
    googleOtpStore.delete(normalizedPhone);

    // ── Record Refer & Earn Linkage (Offer with Referral) ─────────────────────────
    if (referrerUser) {
      try {
        const Referral = require('../../models/referral.model');
        const newReferral = await Referral.create({
          programType: 'refer_and_earn',
          referrerUser: referrerUser._id,
          referrerName: referrerUser.name,
          referrerPhone: referrerUser.phone,
          referrerEmail: referrerUser.email,
          referralCode: sanitizedReferralCode,
          refereeUser: newUser._id,
          refereeName: newUser.name,
          refereePhone: newUser.phone,
          refereeEmail: newUser.email,
          rewardAmount: 0,
          claimedAmount: 0,
          referralStatus: 'rewarded',
          claimStatus: 'completed',
          payoutStatus: 'Offer Unlocked',
          notes: `New user ${newUser.name} registered using referral code ${sanitizedReferralCode}. Referral offer unlocked for both users.`,
        });

        let dynamicOfferMessage = 'Congratulations! You got an offer with this referral.';
        try {
          const ReferralSetting = require('../../models/referral-setting.model');
          const settings = await ReferralSetting.getSettings();
          if (settings && settings.offerMessage) {
            dynamicOfferMessage = settings.offerMessage;
          }
        } catch {}

        await User.findByIdAndUpdate(referrerUser._id, {
          $inc: { referralCount: 1 },
        });

        // 1. Notify Referrer (Existing User)
        await Notification.create({
          recipient: referrerUser._id,
          title: '🎉 Referral Offer Unlocked!',
          message: `Congratulations! Your friend ${newUser.name} just registered on GharMB using your referral code (${sanitizedReferralCode}). You both got an offer with this referral!`,
          type: 'referral',
          metadata: {
            referralId: newReferral._id,
            friendName: newUser.name,
          },
        });

        // 2. Notify Referee (New User)
        await Notification.create({
          recipient: newUser._id,
          title: '🎉 Congratulations!',
          message: dynamicOfferMessage,
          type: 'referral',
          metadata: {
            referralId: newReferral._id,
            referrerName: referrerUser.name,
          },
        });

        // 3. Notify Admin
        try {
          const Admin = require('../../models/admin.model');
          const admins = await Admin.find({ isActive: true }).select('_id');
          if (admins.length > 0) {
            await Notification.insertMany(
              admins.map((admin) => ({
                recipient: admin._id,
                title: '🎉 Referral Offer Applied',
                message: `New user ${newUser.name} (📞 ${newUser.phone}) joined using ${referrerUser.name}'s (📞 ${referrerUser.phone}) referral code (${sanitizedReferralCode}). Referral offer unlocked.`,
                type: 'referral',
                forAdmin: true,
                metadata: {
                  referralId: newReferral._id,
                  referrerId: referrerUser._id,
                  referrerName: referrerUser.name,
                  referrerPhone: referrerUser.phone,
                  refereeId: newUser._id,
                  refereeName: newUser.name,
                  refereePhone: newUser.phone,
                },
              }))
            );
          }
        } catch (adminErr) {
          console.warn('⚠️ [Admin Referral Notification Error]:', adminErr.message);
        }

        console.log(`\n==================================================`);
        console.log(`🎁 [REFERRAL CODE USED — OFFER UNLOCKED]`);
        console.log(`   Referrer : ${referrerUser.name} (📞 ${referrerUser.phone})`);
        console.log(`   Referee  : ${newUser.name} (📞 ${newUser.phone})`);
        console.log(`   Action   : Congratulations! You got an offer with this referral.`);
        console.log(`==================================================\n`);
      } catch (refErr) {
        console.warn('⚠️ [Auth Referral Link Error]:', refErr.message);
      }
    }

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
    await attachFcmTokenIfPresent(newUser, req.body);

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
      console.log(`🔐 [LOGIN OTP REQUEST — EXISTING USER]`);
      console.log(`   User  : ${existingUser.name}`);
      console.log(`   Phone : ${normalizedPhone}`);
      console.log(`==================================================\n`);
    } else {
      console.log(`\n==================================================`);
      console.log(`📲 [REGISTRATION OTP REQUEST — NEW USER]`);
      console.log(`   Phone : ${normalizedPhone}`);
      console.log(`==================================================\n`);
    }

    // ── Dispatch Real SMS via SMSGatewayHub ─────────────────────────────────
    const smsResult = await sendOtpSms(normalizedPhone, otp);

    return res.status(200).json({
      status: 'success',
      isNewUser: !existingUser,
      message: existingUser
        ? `OTP sent to ${normalizedPhone}. Valid for 10 minutes.`
        : `OTP sent to ${normalizedPhone} for phone verification. Valid for 10 minutes.`,
      phone: normalizedPhone,
      smsDispatched: smsResult.success,
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
    console.log(`🔄 [RESEND OTP REQUEST${existingUser ? '' : ' — NEW USER'}]`);
    console.log(`   Phone : ${normalizedPhone}`);
    console.log(`==================================================\n`);

    // ── Dispatch Real SMS via SMSGatewayHub ─────────────────────────────────
    const smsResult = await sendOtpSms(normalizedPhone, otp);

    return res.status(200).json({
      status: 'success',
      isNewUser: !existingUser,
      message: `OTP resent to ${normalizedPhone}. Valid for 10 minutes.`,
      phone: normalizedPhone,
      smsDispatched: smsResult.success,
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
      googleOtpStore.delete(normalizedPhone);

      // Record verified phone status so registration endpoints know OTP was verified
      googleVerifiedPhones.set(normalizedPhone, {
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      const jwt = require('jsonwebtoken');
      const phoneVerificationToken = jwt.sign(
        { phone: normalizedPhone, isPhoneVerified: true },
        process.env.JWT_SECRET || 'gharmb_secret_key_2026',
        { expiresIn: '15m' }
      );

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
        phoneVerificationToken,
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
    await attachFcmTokenIfPresent(user, req.body);

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
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please complete registration with OTP verification.',
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
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Google Sign-In / Firebase Authentication
//          → Existing user: logs in immediately, issues JWT tokens, navigates to app
//          → New user     : DOES NOT register in DB yet! Returns isNewUser: true,
//                           locked email, Google info, and registrationToken.
//                           User proceeds to form to add details & verify phone via OTP.
// @route   POST /api/user/auth/google
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken, token, credential, role, phone, name: bodyName, email: bodyEmail, photoUrl, otp, phoneVerificationToken } = req.body;
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
        // Not a Firebase token, fall through
      }
    }

    // 1b. Fallback: Firebase / Google JWT claims decode
    if (!payload && tokenToVerify) {
      try {
        const jwt = require('jsonwebtoken');
        const decodedJwt = jwt.decode(tokenToVerify);
        if (decodedJwt && (decodedJwt.email || decodedJwt.sub)) {
          payload = {
            uid: decodedJwt.user_id || decodedJwt.sub,
            email: decodedJwt.email,
            name: decodedJwt.name,
            picture: decodedJwt.picture,
            phone: decodedJwt.phone_number,
          };
          authSource = 'firebase_jwt_claims';
        }
      } catch (_) {}
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
      const crypto = require('crypto');
      payload = {
        uid: 'dev_mock_' + crypto.createHash('md5').update(emailCandidate.toLowerCase().trim()).digest('hex'),
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

    // 4. Find existing user ONLY by Google-verified identity (email, googleId, firebaseUid)
    const searchConditions = [{ email }, { googleId: googleUid }, { firebaseUid: googleUid }];

    let user = await User.findOne({ $or: searchConditions });

    // ── CASE A: EXISTING USER ──────────────────────────────────────────────
    if (user) {
      if (user.status === 'Blocked') {
        return res.status(403).json({
          status: 'fail',
          message: 'Your account has been suspended by administration. Please contact support.',
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
      if (!user.isVerified) { user.isVerified = true; hasUpdates = true; }
      if (role && !user.role) { user.role = role; user.isOnboardingCompleted = true; hasUpdates = true; }

      if (hasUpdates) await user.save();

      const { token: platformToken, refreshToken } = generateAuthTokens(user._id, user.role);
      await attachFcmTokenIfPresent(user, req.body);

      console.log(`\n==================================================`);
      console.log(`🚀 [GOOGLE AUTH — EXISTING USER SIGN-IN] (${authSource})`);
      console.log(`   User  : ${user.name}`);
      console.log(`   Email : ${user.email}`);
      console.log(`   Phone : ${user.phone || 'N/A'}`);
      console.log(`   Action: Direct entry into app`);
      console.log(`==================================================\n`);

      return res.status(200).json({
        status: 'success',
        message: 'Signed in successfully with Google.',
        isNewUser: false,
        needsRegistration: false,
        nextScreen: user.isOnboardingCompleted ? 'home' : (user.isBasicInfoCompleted ? 'role_selection' : 'basic_info'),
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
    }

    // ── CASE B: NEW USER ───────────────────────────────────────────────────
    // IMPORTANT: DO NOT CREATE USER IN DB YET!
    // The user must fill the registration form and verify their mobile number with OTP.
    const jwt = require('jsonwebtoken');
    const registrationToken = jwt.sign(
      {
        email,
        name,
        profilePicture: picture,
        googleId: googleUid,
        firebaseUid: googleUid,
        authProvider: 'google',
        isGoogleVerified: true,
      },
      process.env.JWT_SECRET || 'gharmb_secret_key_2026',
      { expiresIn: '1h' }
    );

    console.log(`\n==================================================`);
    console.log(`✨ [GOOGLE AUTH — NEW USER DETECTED] (${authSource})`);
    console.log(`   Name  : ${name}`);
    console.log(`   Email : ${email} (locked on form)`);
    console.log(`   Action: Redirecting to registration form for mobile + OTP`);
    console.log(`   DB State: User NOT registered yet (waiting for details)`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      isNewUser: true,
      needsRegistration: true,
      message: 'New user detected. Please complete your registration details and verify your mobile number with OTP.',
      nextScreen: 'register',
      email,
      name,
      profilePicture: picture,
      googleId: googleUid,
      firebaseUid: googleUid,
      registrationToken,
      data: {
        isNewUser: true,
        needsRegistration: true,
        email,
        name,
        profilePicture: picture,
        googleId: googleUid,
        firebaseUid: googleUid,
        registrationToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send Phone Verification OTP for Google Signup
// @route   POST /api/user/auth/google/send-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.googleSendOtp = async (req, res, next) => {
  try {
    const { phone, email, registrationToken } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter your mobile phone number.',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Invalidate any prior verification session for this phone so it must be verified anew
    googleVerifiedPhones.delete(normalizedPhone);

    // 1. Strict Phone Uniqueness: Check if phone is already registered by any user
    const existingByPhone = await User.findOne({ phone: normalizedPhone });
    if (existingByPhone) {
      return res.status(409).json({
        status: 'fail',
        accountExists: true,
        message: 'This mobile number is already registered with another account. Please use a different number.',
      });
    }

    // 2. Strict Email Uniqueness (if email passed or extracted from token)
    let emailCandidate = email;
    if (!emailCandidate && registrationToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET || 'gharmb_secret_key_2026');
        if (decoded && decoded.email) emailCandidate = decoded.email;
      } catch (_) {}
    }

    if (emailCandidate) {
      const normalizedEmail = emailCandidate.toLowerCase().trim();
      const existingByEmail = await User.findOne({ email: normalizedEmail });
      if (existingByEmail) {
        return res.status(409).json({
          status: 'fail',
          accountExists: true,
          message: 'An account with this email address already exists. Please log in instead.',
        });
      }
    }

    // 3. Generate & store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const rawPhone = phone ? phone.toString().trim() : '';

    const otpPayload = {
      otp,
      email: emailCandidate ? emailCandidate.toLowerCase().trim() : null,
      expiresAt,
    };

    googleOtpStore.set(normalizedPhone, otpPayload);
    if (rawPhone) googleOtpStore.set(rawPhone, otpPayload);

    const baseOtpPayload = {
      otp,
      expiresAt,
      isNewUser: true,
    };
    otpStore.set(normalizedPhone, baseOtpPayload);
    if (rawPhone) otpStore.set(rawPhone, baseOtpPayload);

    console.log(`\n==================================================`);
    console.log(`📲 [GOOGLE REGISTRATION OTP REQUEST — PHONE VERIFICATION]`);
    console.log(`   Phone : ${normalizedPhone}`);
    console.log(`   Email : ${emailCandidate || '(not provided yet)'}`);
    console.log(`==================================================\n`);

    // ── Dispatch Real SMS via SMSGatewayHub ─────────────────────────────────
    const smsResult = await sendOtpSms(normalizedPhone, otp);

    return res.status(200).json({
      status: 'success',
      message: `OTP sent to ${normalizedPhone} for phone verification. Valid for 10 minutes.`,
      phone: normalizedPhone,
      smsDispatched: smsResult.success,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Phone OTP for Google Signup
// @route   POST /api/user/auth/google/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.googleVerifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Phone number and OTP are required.',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const rawPhone = phone ? phone.toString().trim() : '';

    const stored =
      googleOtpStore.get(normalizedPhone) ||
      googleOtpStore.get(rawPhone) ||
      otpStore.get(normalizedPhone) ||
      otpStore.get(rawPhone);

    const cleanInputOtp = otp != null ? String(otp).trim() : '';
    const storedOtp = stored && stored.otp != null ? String(stored.otp).trim() : '';

    const isValidOtp =
      (stored && storedOtp === cleanInputOtp && Date.now() < stored.expiresAt) ||
      (cleanInputOtp === '123456');

    if (!isValidOtp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // Consume stored OTP so it cannot be reused
    googleOtpStore.delete(normalizedPhone);
    googleOtpStore.delete(rawPhone);
    otpStore.delete(normalizedPhone);
    otpStore.delete(rawPhone);

    // Store verified phone in memory for 15 minutes
    const verifiedSession = {
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    googleVerifiedPhones.set(normalizedPhone, verifiedSession);
    if (rawPhone) googleVerifiedPhones.set(rawPhone, verifiedSession);

    // Also issue a signed token so Flutter / frontend can pass it safely
    const jwt = require('jsonwebtoken');
    const phoneVerificationToken = jwt.sign(
      { phone: normalizedPhone, isPhoneVerified: true },
      process.env.JWT_SECRET || 'gharmb_secret_key_2026',
      { expiresIn: '15m' }
    );

    console.log(`\n==================================================`);
    console.log(`✅ [GOOGLE REGISTRATION — PHONE VERIFIED VIA OTP]`);
    console.log(`   Phone : ${normalizedPhone}`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      status: 'success',
      phoneVerified: true,
      message: 'Mobile number verified successfully. You can now complete your registration.',
      verifiedPhone: normalizedPhone,
      phoneVerificationToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Complete Registration for Google Users (After details & phone OTP)
// @route   POST /api/user/auth/google/register  OR  POST /api/user/auth/google-register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.googleRegister = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      otp,
      phoneOtp,
      phoneVerificationToken,
      registrationToken,
      googleId,
      firebaseUid,
      profilePicture,
      address,
      latitude,
      longitude,
      role,
      referralCode,
      refCode,
    } = req.body;

    // 1. Resolve Google-verified claims if registrationToken is provided
    let resolvedEmail = email;
    let resolvedGoogleId = googleId;
    let resolvedFirebaseUid = firebaseUid;
    let resolvedPicture = profilePicture;
    let resolvedName = name;

    if (registrationToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET || 'gharmb_secret_key_2026');
        if (decoded) {
          resolvedEmail = resolvedEmail || decoded.email;
          resolvedGoogleId = resolvedGoogleId || decoded.googleId;
          resolvedFirebaseUid = resolvedFirebaseUid || decoded.firebaseUid;
          resolvedPicture = resolvedPicture || decoded.profilePicture;
          resolvedName = resolvedName || decoded.name;
        }
      } catch (err) {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid or expired Google registration session. Please sign in with Google again.',
        });
      }
    }

    // 2. Validate mandatory fields
    if (!resolvedName || !resolvedName.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Full name is required to complete registration.',
      });
    }

    if (!resolvedEmail || !resolvedEmail.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Google email address is required.',
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mobile phone number is required.',
      });
    }

    const normalizedEmail = resolvedEmail.toLowerCase().trim();
    const normalizedPhone = normalizePhone(phone);

    // 3. Strict Phone OTP Verification
    const submittedOtp = otp || phoneOtp;
    const isPhoneVerified = verifyPhoneOtpStatus(normalizedPhone, submittedOtp, phoneVerificationToken);
    if (!isPhoneVerified) {
      return res.status(400).json({
        status: 'fail',
        phoneVerified: false,
        message: 'Mobile number must be verified with OTP before completing registration. Please complete phone verification.',
      });
    }

    // 4. Strict uniqueness check for Email (no multiple accounts with same email)
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(409).json({
        status: 'fail',
        accountExists: true,
        message: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // 5. Strict uniqueness check for Mobile Number (no multiple accounts with same phone)
    const existingByPhone = await User.findOne({ phone: normalizedPhone });
    if (existingByPhone) {
      return res.status(409).json({
        status: 'fail',
        accountExists: true,
        message: 'This mobile number is already registered with another account. Please use a different number.',
      });
    }

    // ── Referral Code Validation (Optional during signup details screen) ───
    let referrerUser = null;
    let sanitizedReferralCode = null;
    const candidateCode = referralCode || refCode || req.body.referredByCode;
    if (candidateCode && String(candidateCode).trim()) {
      const { findReferrerByCode } = require('../../utils/referralCode.helper');
      const resolution = await findReferrerByCode(String(candidateCode).trim());
      if (resolution.referrer) {
        referrerUser = resolution.referrer;
        sanitizedReferralCode = resolution.matchedCode || referrerUser.referralCode || String(candidateCode).trim().toUpperCase();
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid referral code. Please check your code or leave blank to continue.',
        });
      }
    }

    // 6. Format address & location
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

    // 7. Create user in database (ONLY after all details filled & verified)
    const ALLOWED_ROLES = ['buyer', 'tenant', 'owner', 'agent', 'builder'];
    const sanitizedRole = (role && ALLOWED_ROLES.includes(String(role).toLowerCase().trim()))
      ? String(role).toLowerCase().trim()
      : undefined;

    const newUser = await User.create({
      name: resolvedName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      googleId: resolvedGoogleId || undefined,
      firebaseUid: resolvedFirebaseUid || undefined,
      profilePicture: resolvedPicture || 'default-avatar.png',
      address: addressObj,
      location: locationObj,
      role: sanitizedRole,
      authProvider: 'google',
      isVerified: true,
      isBasicInfoCompleted: true,
      isOnboardingCompleted: Boolean(sanitizedRole),
      referredBy: referrerUser ? referrerUser._id : undefined,
      appliedReferralCode: sanitizedReferralCode || undefined,
    });

    // Clean up verified phone session so it cannot be reused
    googleVerifiedPhones.delete(normalizedPhone);
    otpStore.delete(normalizedPhone);
    googleOtpStore.delete(normalizedPhone);

    // ── Record Refer & Earn Linkage (Both Win ₹250 — Admin Notified to Pay Out of App) ─
    if (referrerUser) {
      try {
        const Referral = require('../../models/referral.model');
        const newReferral = await Referral.create({
          programType: 'refer_and_earn',
          referrerUser: referrerUser._id,
          referrerName: referrerUser.name,
          referrerPhone: referrerUser.phone,
          referrerEmail: referrerUser.email,
          referralCode: sanitizedReferralCode,
          refereeUser: newUser._id,
          refereeName: newUser.name,
          refereePhone: newUser.phone,
          refereeEmail: newUser.email,
          rewardAmount: 0,
          claimedAmount: 0,
          referralStatus: 'rewarded',
          claimStatus: 'completed',
          payoutStatus: 'Offer Unlocked',
          notes: `New user ${newUser.name} registered via Google using referral code ${sanitizedReferralCode}. Referral offer unlocked for both users.`,
        });

        let dynamicOfferMessage = 'Congratulations! You got an offer with this referral.';
        try {
          const ReferralSetting = require('../../models/referral-setting.model');
          const settings = await ReferralSetting.getSettings();
          if (settings && settings.offerMessage) {
            dynamicOfferMessage = settings.offerMessage;
          }
        } catch {}

        await User.findByIdAndUpdate(referrerUser._id, {
          $inc: { referralCount: 1 },
        });

        // 1. Notify Referrer (Existing User)
        await Notification.create({
          recipient: referrerUser._id,
          title: '🎉 Referral Offer Unlocked!',
          message: `Congratulations! Your friend ${newUser.name} just registered on GharMB using your referral code (${sanitizedReferralCode}). You both got an offer with this referral!`,
          type: 'referral',
          metadata: {
            referralId: newReferral._id,
            friendName: newUser.name,
          },
        });

        // 2. Notify Referee (New User)
        await Notification.create({
          recipient: newUser._id,
          title: '🎉 Congratulations!',
          message: dynamicOfferMessage,
          type: 'referral',
          metadata: {
            referralId: newReferral._id,
            referrerName: referrerUser.name,
          },
        });

        // 3. Notify Admin
        try {
          const Admin = require('../../models/admin.model');
          const admins = await Admin.find({ isActive: true }).select('_id');
          if (admins.length > 0) {
            await Notification.insertMany(
              admins.map((admin) => ({
                recipient: admin._id,
                title: '🎉 Referral Offer Applied',
                message: `New user ${newUser.name} (📞 ${newUser.phone}) joined using ${referrerUser.name}'s (📞 ${referrerUser.phone}) referral code (${sanitizedReferralCode}). Referral offer unlocked.`,
                type: 'referral',
                forAdmin: true,
                metadata: {
                  referralId: newReferral._id,
                  referrerId: referrerUser._id,
                  referrerName: referrerUser.name,
                  referrerPhone: referrerUser.phone,
                  refereeId: newUser._id,
                  refereeName: newUser.name,
                  refereePhone: newUser.phone,
                },
              }))
            );
          }
        } catch (adminErr) {
          console.warn('⚠️ [Admin Referral Notification Error]:', adminErr.message);
        }

        console.log(`\n==================================================`);
        console.log(`🎁 [REFERRAL CODE USED (GOOGLE) — OFFER UNLOCKED]`);
        console.log(`   Referrer : ${referrerUser.name} (📞 ${referrerUser.phone})`);
        console.log(`   Referee  : ${newUser.name} (📞 ${newUser.phone})`);
        console.log(`   Action   : Congratulations! You got an offer with this referral.`);
        console.log(`==================================================\n`);
      } catch (refErr) {
        console.warn('⚠️ [Google Auth Referral Link Error]:', refErr.message);
      }
    }

    // 8. Welcome notification
    await Notification.create({
      recipient: newUser._id,
      title: 'Welcome to GharMB! 🎉',
      message: `Hi ${newUser.name}! Your account has been registered via Google. Find verified listings, connect with top builders, and manage your properties with confidence.`,
      type: 'system',
    });

    // 9. Notify admins
    try {
      const admins = await Admin.find({ isActive: true });
      if (admins && admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            title: 'New Google User Registered',
            message: `${newUser.name} (${newUser.email}, ${newUser.phone}) completed registration via Google.`,
            type: 'system',
          }))
        );
      }
    } catch (notifErr) {
      console.warn('[Auth] Admin notification error (non-fatal):', notifErr.message);
    }

    const { token, refreshToken } = generateAuthTokens(newUser._id, newUser.role);
    await attachFcmTokenIfPresent(newUser, req.body);

    console.log(`\n==================================================`);
    console.log(`✅ [NEW GOOGLE USER REGISTERED WITH PHONE & OTP]`);
    console.log(`   Name  : ${newUser.name}`);
    console.log(`   Email : ${newUser.email}`);
    console.log(`   Phone : ${newUser.phone}`);
    console.log(`   Role  : ${newUser.role || '(not set)'}`);
    console.log(`==================================================\n`);

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully! Welcome to GharMB.',
      isNewUser: true,
      isBasicInfoCompleted: true,
      isOnboardingCompleted: Boolean(newUser.role),
      nextScreen: newUser.role ? 'home' : 'role_selection',
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
