const Admin = require("../../models/admin.model"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find admin by email
    const admin = await Admin.findOne({ email });
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

    // 4. Verify password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Increment login attempts
      admin.loginAttempts += 1;

      // Lock account if max attempts reached
      if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockUntil = Date.now() + LOCK_TIME;
      }
      
      await admin.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 5. Successful login: Reset login attempts and lock status
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    // 6. Generate JWT Token
    const secret = process.env.JWT_SECRET || "gharmb_secret_key_2026";
    const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      secret, 
      { expiresIn }
    );

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || null,
      firebaseUid: admin.firebaseUid || null,
    };

    // 7. Send response
    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      admin: adminData,
      data: {
        token,
        admin: adminData,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Admin Google / Firebase Sign-In
// @route   POST /api/admin/auth/google OR /api/admin/auth/firebase
// @access  Public
exports.adminGoogleLogin = async (req, res) => {
  try {
    const { idToken, token, credential, email: bodyEmail, name: bodyName, photoUrl } = req.body;
    const tokenToVerify = idToken || token || credential;

    if (!tokenToVerify && !bodyEmail) {
      return res.status(400).json({
        message: "Google / Firebase authentication token is required.",
      });
    }

    let verifiedEmail = null;
    let decodedUid = null;
    let decodedName = null;
    let decodedPicture = null;

    // 1. Verify with Firebase Admin if available
    try {
      const { auth: firebaseAuth } = require("../../config/firebase");
      if (tokenToVerify && firebaseAuth && typeof firebaseAuth.verifyIdToken === 'function') {
        const decoded = await firebaseAuth.verifyIdToken(tokenToVerify);
        if (decoded?.email) {
          verifiedEmail = decoded.email.toLowerCase().trim();
          decodedUid = decoded.uid;
          decodedName = decoded.name || decoded.displayName;
          decodedPicture = decoded.picture || decoded.photoURL;
        }
      }
    } catch (fbErr) {
      // Not a Firebase token, will attempt Google OAuth next
    }

    // 2. Verify with Google OAuth Library if not verified yet
    if (!verifiedEmail && tokenToVerify) {
      try {
        const { OAuth2Client } = require("google-auth-library");
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: tokenToVerify,
          audience: process.env.GOOGLE_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID] : undefined,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          verifiedEmail = payload.email.toLowerCase().trim();
          decodedUid = payload.sub;
          decodedName = payload.name;
          decodedPicture = payload.picture;
        }
      } catch (gErr) {
        // Verification failed
      }
    }

    // 3. Fallback for Local Dev testing
    if (!verifiedEmail && process.env.NODE_ENV !== "production" && (tokenToVerify === "dev-mock-token" || bodyEmail)) {
      verifiedEmail = (bodyEmail || req.body.email || "").toLowerCase().trim();
      decodedName = bodyName || req.body.name || "Admin";
      decodedPicture = photoUrl || req.body.picture || null;
      decodedUid = "dev_admin_" + Buffer.from(verifiedEmail).toString("hex").slice(0, 12);
    }

    if (!verifiedEmail) {
      return res.status(401).json({
        message: "Invalid, malformed, or expired Google / Firebase authentication token.",
      });
    }

    // Find admin by verified email or firebaseUid
    let admin = await Admin.findOne({
      $or: [
        { email: verifiedEmail },
        ...(decodedUid ? [{ firebaseUid: decodedUid }] : [])
      ]
    });

    // Check if email is in ADMIN_ALLOWED_EMAILS or auto-create if designated as admin
    const rawAllowed = process.env.ADMIN_ALLOWED_EMAILS || "admin@gmail.com,admin@gharmb.com";
    const allowedEmails = rawAllowed.split(",").map(e => e.trim().toLowerCase());

    if (!admin && (allowedEmails.includes(verifiedEmail) || process.env.NODE_ENV !== "production")) {
      const crypto = require("crypto");
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      admin = await Admin.create({
        name: decodedName || bodyName || "Admin",
        email: verifiedEmail,
        password: hashedPassword,
        role: "ADMIN",
        firebaseUid: decodedUid || undefined,
        avatar: decodedPicture || undefined,
        isActive: true,
      });
      console.log(`Auto-created Admin account for verified user: ${verifiedEmail}`);
    }

    if (!admin) {
      return res.status(403).json({
        message: `Access denied. No administrator account found with email: ${verifiedEmail}. Please contact your administrator.`,
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Your admin account has been deactivated.",
      });
    }

    // Reset login attempts & link firebaseUid/avatar if not set
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    if (decodedUid && !admin.firebaseUid) {
      admin.firebaseUid = decodedUid;
    }
    if (decodedPicture && !admin.avatar) {
      admin.avatar = decodedPicture;
    }
    await admin.save();

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || "gharmb_secret_key_2026";
    const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d";
    const platformToken = jwt.sign(
      { id: admin._id, role: admin.role },
      secret,
      { expiresIn }
    );

    const adminData = {
      id: admin._id,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar || decodedPicture || null,
      firebaseUid: admin.firebaseUid || decodedUid || null,
    };

    res.status(200).json({
      status: "success",
      message: "Admin Firebase / Google login successful",
      token: platformToken,
      admin: adminData,
      data: {
        token: platformToken,
        admin: adminData,
      },
    });
  } catch (error) {
    console.error("Admin Firebase / Google login error:", error);
    res.status(500).json({ message: "Server error during Firebase / Google login" });
  }
};