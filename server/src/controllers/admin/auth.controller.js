const Admin = require("../../models/admin.model"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken, generateRefreshToken, generateAuthTokens, verifyRefreshToken } = require("../../utils/generateToken");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1. Find admin by email (case-insensitive)
    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated." });
    }

    // 3. Check if account is currently locked
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(403).json({ 
        message: "Account temporarily locked due to too many failed attempts. Try again later." 
      });
    }

    // 4. Verify password strictly against MongoDB bcrypt hash
    let isMatch = false;
    if (admin.password) {
      isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!isMatch) {
      // Increment login attempts for security
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;
      if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockUntil = Date.now() + LOCK_TIME;
      }
      await admin.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 5. Successful login: Reset login attempts and lock status
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    if (req.body.firebaseToken && !admin.firebaseUid) {
      try {
        const decodedJwt = jwt.decode(req.body.firebaseToken);
        if (decodedJwt?.user_id || decodedJwt?.sub) {
          admin.firebaseUid = decodedJwt.user_id || decodedJwt.sub;
        }
      } catch (_) {}
    }
    await admin.save();

    // 7. Generate JWT Access and Refresh Tokens
    const { token, refreshToken } = generateAuthTokens(admin._id, admin.role);

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
    };

    // 8. Send response
    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      accessToken: token,
      refreshToken,
      admin: adminData,
      data: {
        token,
        accessToken: token,
        refreshToken,
        admin: adminData,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Admin Google Sign-In (DISALLOWED - Email & Password only for Admin)
// @route   POST /api/admin/auth/google
// @access  Public
exports.adminGoogleLogin = async (req, res) => {
  return res.status(403).json({
    status: "fail",
    message: "Google sign-in is disabled for the administrator portal. Only administrator email and password authentication is permitted.",
  });
};

// @desc    Admin Firebase Email & Password Sign-In
// @route   POST /api/admin/auth/firebase
// @access  Public
exports.adminFirebaseLogin = async (req, res) => {
  try {
    const { idToken, token, email: bodyEmail, password } = req.body;
    const tokenToVerify = idToken || token;

    if (!tokenToVerify && (!bodyEmail || !password)) {
      return res.status(400).json({
        status: "fail",
        message: "Authentication credentials (email & password or Firebase token) are required.",
      });
    }

    let verifiedEmail = null;
    let decodedUid = null;
    let decodedProvider = null;
    let decodedName = null;
    let decodedPicture = null;

    // 1. Verify Firebase ID token if provided
    if (tokenToVerify) {
      try {
        const { auth: firebaseAuth } = require("../../config/firebase");
        if (firebaseAuth && typeof firebaseAuth.verifyIdToken === "function") {
          const decoded = await firebaseAuth.verifyIdToken(tokenToVerify);
          if (decoded?.email) {
            verifiedEmail = decoded.email.toLowerCase().trim();
            decodedUid = decoded.uid;
            decodedProvider = decoded.firebase?.sign_in_provider || null;
            decodedName = decoded.name || decoded.displayName || null;
            decodedPicture = decoded.picture || decoded.photoURL || null;
          }
        }
      } catch (fbErr) {
        // Fallback: decode Firebase JWT claims if Admin SDK credential is unconfigured locally
        try {
          const decodedJwt = jwt.decode(tokenToVerify);
          if (decodedJwt?.iss?.includes("securetoken.google.com") && decodedJwt?.email) {
            verifiedEmail = decodedJwt.email.toLowerCase().trim();
            decodedUid = decodedJwt.user_id || decodedJwt.sub;
            decodedProvider = decodedJwt.firebase?.sign_in_provider || null;
            decodedName = decodedJwt.name || decodedJwt.displayName || null;
            decodedPicture = decodedJwt.picture || null;
          }
        } catch (_) {}
      }

      // Explicitly reject if user attempted sign-in with Google provider
      if (decodedProvider === "google.com") {
        return res.status(403).json({
          status: "fail",
          message: "Google sign-in is disabled for administrator portal. Only admin email and password authentication is allowed.",
        });
      }
    }

    if (!verifiedEmail && bodyEmail) {
      verifiedEmail = bodyEmail.toLowerCase().trim();
    }

    if (!verifiedEmail) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid, expired, or unverified authentication token.",
      });
    }

    // 2. Strict check: Admin MUST EXIST in database (or match configured ADMIN_EMAIL)
    let admin = await Admin.findOne({ email: { $regex: new RegExp(`^${verifiedEmail}$`, "i") } });

    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "annika9070@gmail.com").toLowerCase().trim();
    if (!admin && verifiedEmail.toLowerCase() === configuredAdminEmail) {
      admin = await Admin.create({
        name: decodedName || "Admin",
        email: verifiedEmail.toLowerCase(),
        role: "ADMIN",
        isActive: true,
        firebaseUid: decodedUid || undefined
      });
      console.log(`Auto-linked administrator account for configured email: ${verifiedEmail}`);
    }

    if (!admin) {
      return res.status(403).json({
        status: "fail",
        message: `Access denied. No administrator account found with email: ${verifiedEmail}.`,
      });
    }

    // 3. Verify account is active
    if (!admin.isActive) {
      return res.status(403).json({
        status: "fail",
        message: "Your administrator account has been deactivated.",
      });
    }

    // 4. Verify admin role
    if (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        status: "fail",
        message: "Access denied. You do not have administrator privileges.",
      });
    }

    // 5. Strict security: If password is provided, it MUST match the active admin password
    if (password) {
      if (!admin.password) {
        return res.status(401).json({
          status: "fail",
          message: "Admin password not set.",
        });
      }
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          admin.lockUntil = Date.now() + LOCK_TIME;
        }
        await admin.save();
        return res.status(401).json({
          status: "fail",
          message: "Invalid email or password.",
        });
      }
    }

    // 6. Reset login attempts & link firebaseUid if missing
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    if (decodedUid && !admin.firebaseUid) {
      admin.firebaseUid = decodedUid;
    }
    if (decodedPicture && !admin.avatar) {
      admin.avatar = decodedPicture;
    }
    await admin.save();

    // 7. Generate platform JWT Access and Refresh Tokens
    const { token: platformToken, refreshToken } = generateAuthTokens(admin._id, admin.role);

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || decodedUid || null,
    };

    return res.status(200).json({
      status: "success",
      message: "Admin authentication successful",
      token: platformToken,
      accessToken: platformToken,
      refreshToken,
      admin: adminData,
      data: {
        token: platformToken,
        accessToken: platformToken,
        refreshToken,
        admin: adminData,
      },
    });
  } catch (error) {
    console.error("Admin Firebase login error:", error);
    return res.status(500).json({ status: "error", message: "Server error during admin authentication" });
  }
};

// @desc    Refresh Admin Authentication Token
// @route   POST /api/admin/auth/refresh-token  OR  POST /api/admin/auth/refresh
// @access  Public
exports.adminRefreshToken = async (req, res) => {
  try {
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
        message: 'Refresh token is required. Please provide it in request body (refreshToken) or headers.',
      });
    }

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

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        status: 'fail',
        code: 'ADMIN_NOT_FOUND',
        message: 'The administrator belonging to this token no longer exists.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        status: 'fail',
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your administrator account has been deactivated.',
      });
    }

    const newTokens = generateAuthTokens(admin._id, admin.role);

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
    };

    return res.status(200).json({
      status: 'success',
      message: 'Admin token refreshed successfully.',
      token: newTokens.token,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      admin: adminData,
      data: {
        token: newTokens.token,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        admin: adminData,
      },
    });
  } catch (error) {
    console.error("Admin refresh token error:", error);
    res.status(500).json({ message: "Server error during admin token refresh" });
  }
};

// @desc    Get Current Admin Profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");
    if (!admin) {
      return res.status(404).json({ status: "fail", message: "Admin account not found." });
    }
    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
    res.status(200).json({
      status: "success",
      admin: adminData,
      data: adminData,
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ status: "error", message: "Server error fetching admin profile" });
  }
};

// @desc    Update Admin Login Email
// @route   PUT /api/admin/auth/email OR /api/admin/auth/update-email
// @access  Private (Admin)
exports.updateAdminEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || typeof newEmail !== "string") {
      return res.status(400).json({
        status: "fail",
        message: "A valid email address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email address format.",
      });
    }

    const admin = await Admin.findById(req.user._id).select("+password");
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin account not found.",
      });
    }

    if (admin.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        status: "fail",
        message: "The new email is identical to your current email.",
      });
    }

    // Check if new email is in use by another admin
    const emailConflict = await Admin.findOne({
      email: normalizedEmail,
      _id: { $ne: admin._id },
    });
    if (emailConflict) {
      return res.status(400).json({
        status: "fail",
        message: "This email address is already associated with another administrator.",
      });
    }

    // If current password provided, verify it
    if (currentPassword && admin.password) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({
          status: "fail",
          message: "Current password is incorrect. Verification failed.",
        });
      }
    }

    const previousEmail = admin.email;
    admin.email = normalizedEmail;

    // Sync with Firebase Auth if Firebase UID exists
    try {
      const { auth: firebaseAuth } = require("../../config/firebase");
      if (firebaseAuth && admin.firebaseUid && typeof firebaseAuth.updateUser === "function") {
        await firebaseAuth.updateUser(admin.firebaseUid, {
          email: normalizedEmail,
        });
        console.log(`Synced email in Firebase Auth for UID: ${admin.firebaseUid}`);
      }
    } catch (fbSyncErr) {
      console.warn("Firebase Auth email sync warning (continuing DB update):", fbSyncErr.message);
    }

    await admin.save();

    // Re-issue tokens
    const { token, refreshToken } = generateAuthTokens(admin._id, admin.role);

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
      isActive: admin.isActive,
    };

    return res.status(200).json({
      status: "success",
      message: `Admin login email changed from ${previousEmail} to ${normalizedEmail}`,
      token,
      accessToken: token,
      refreshToken,
      admin: adminData,
      data: {
        token,
        accessToken: token,
        refreshToken,
        admin: adminData,
      },
    });
  } catch (error) {
    console.error("Error updating admin email:", error);
    res.status(500).json({ status: "error", message: "Server error updating admin email" });
  }
};

// @desc    Initiate Password Reset Link via Firebase
// @route   POST /api/admin/auth/send-password-reset-link
// @access  Private / Public
exports.sendAdminPasswordResetLink = async (req, res) => {
  try {
    const email = (req.body?.email || req.user?.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Email address is required.",
      });
    }

    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: `No administrator found with email: ${email}`,
      });
    }

    let resetLink = null;
    let linkGenerationError = null;

    // Generate password reset link via Firebase Admin SDK if available
    try {
      const { auth: firebaseAuth } = require("../../config/firebase");
      if (firebaseAuth && typeof firebaseAuth.generatePasswordResetLink === "function") {
        resetLink = await firebaseAuth.generatePasswordResetLink(email);
      }
    } catch (fbErr) {
      linkGenerationError = fbErr.message;
      console.warn("Firebase Admin generatePasswordResetLink notice:", fbErr.message);
    }

    return res.status(200).json({
      status: "success",
      message: `Password reset verification link initiated for ${email}. Check your email to set a new password.`,
      email,
      resetLink,
      note: "Password must be changed via Firebase link verification.",
      firebaseNotice: linkGenerationError ? linkGenerationError : undefined,
    });
  } catch (error) {
    console.error("Error initiating password reset link:", error);
    res.status(500).json({ status: "error", message: "Server error initiating password reset link" });
  }
};

// @desc    Change Admin Password directly
// @route   PUT /api/admin/auth/password OR /api/admin/auth/change-password
// @access  Private (Admin)
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({
        status: "fail",
        message: "New password must be at least 6 characters long.",
      });
    }

    const admin = await Admin.findById(req.user._id).select("+password");
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin account not found.",
      });
    }

    const email = admin.email?.toLowerCase().trim();
    let isCurrentPasswordValid = false;

    if (admin.password && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: "fail",
          message: "Current password is incorrect.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    admin.password = hashedPassword;
    await admin.save();

    // Sync new password to Firebase Auth
    try {
      const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyAAqrQkw6wmDLWUgy2b8iEQK0LPUh5m-G8";
      const { auth: firebaseAuth } = require("../../config/firebase");
      if (firebaseAuth && admin.firebaseUid && typeof firebaseAuth.updateUser === "function") {
        await firebaseAuth.updateUser(admin.firebaseUid, { password: newPassword.trim() });
      }
    } catch (_) {}

    return res.status(200).json({
      status: "success",
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error updating admin password:", error);
    res.status(500).json({ status: "error", message: "Server error updating password." });
  }
};

// @desc    Update Admin Profile & Credentials in one unified request
// @route   PUT /api/admin/auth/profile
// @access  Private (Admin)
exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user._id).select("+password");
    if (!admin) {
      return res.status(404).json({ status: "fail", message: "Admin account not found." });
    }

    let isModified = false;
    let messages = [];

    // 1. Update Name
    if (name && typeof name === "string" && name.trim() && name.trim() !== admin.name) {
      admin.name = name.trim();
      isModified = true;
      messages.push("Name updated");
    }

    // 2. Update Email
    if (email && typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail && normalizedEmail !== admin.email) {
        if (admin.password) {
          if (!currentPassword) {
            return res.status(400).json({
              status: "fail",
              message: "Current password is required to change administrator email."
            });
          }
          const isMatch = await bcrypt.compare(currentPassword, admin.password);
          if (!isMatch) {
            return res.status(400).json({
              status: "fail",
              message: "Current password is incorrect."
            });
          }
        }

        const existing = await Admin.findOne({
          email: normalizedEmail,
          _id: { $ne: admin._id }
        });
        if (existing) {
          return res.status(400).json({
            status: "fail",
            message: "This email address is already registered to another administrator."
          });
        }

        admin.email = normalizedEmail;
        isModified = true;
        messages.push("Email updated");
      }
    }

    // 3. Update Password
    if (newPassword && typeof newPassword === "string" && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({
          status: "fail",
          message: "New password must be at least 6 characters long."
        });
      }

      if (admin.password) {
        if (!currentPassword) {
          return res.status(400).json({
            status: "fail",
            message: "Current password is required to set a new password."
          });
        }
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          return res.status(400).json({
            status: "fail",
            message: "Current password is incorrect."
          });
        }
      }

      admin.password = await bcrypt.hash(newPassword.trim(), 10);
      isModified = true;
      messages.push("Password updated");
    }

    if (isModified) {
      await admin.save();
    }

    const { token, refreshToken } = generateAuthTokens(admin._id, admin.role);
    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
      isActive: admin.isActive,
    };

    return res.status(200).json({
      status: "success",
      message: messages.length ? `Changes saved successfully: ${messages.join(", ")}.` : "Settings saved successfully.",
      token,
      accessToken: token,
      refreshToken,
      admin: adminData,
      data: {
        token,
        accessToken: token,
        refreshToken,
        admin: adminData
      }
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ status: "error", message: "Server error saving changes." });
  }
};
