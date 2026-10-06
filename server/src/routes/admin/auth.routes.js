const express = require("express");
const router = express.Router();
const {
  adminLogin,
  adminFirebaseLogin,
  adminGoogleLogin,
  adminRefreshToken,
  getAdminProfile,
  updateAdminProfile,
  updateAdminEmail,
  updateAdminPassword,
  sendAdminPasswordResetLink,
} = require("../../controllers/admin/auth.controller");
const protect = require("../../middlewares/auth.middleware");

// POST /api/admin/auth/login (Standard email + password login)
router.post("/login", adminLogin);

// POST /api/admin/auth/google (Disallowed for admin)
router.post("/google", adminGoogleLogin);

// POST /api/admin/auth/firebase (Firebase email + password verified login)
router.post("/firebase", adminFirebaseLogin);

// POST /api/admin/auth/refresh-token  &  /api/admin/auth/refresh
router.post("/refresh-token", adminRefreshToken);
router.post("/refresh", adminRefreshToken);

// GET /api/admin/auth/me - Current Admin Profile
router.get("/me", protect, getAdminProfile);

// PUT /api/admin/auth/profile - Unified Profile update (name, email, password)
router.put("/profile", protect, updateAdminProfile);
router.put("/update-profile", protect, updateAdminProfile);

// PUT /api/admin/auth/email OR /api/admin/auth/update-email - Update login email
router.put("/email", protect, updateAdminEmail);
router.put("/update-email", protect, updateAdminEmail);

// PUT /api/admin/auth/password OR /api/admin/auth/change-password - Change admin password directly
router.put("/password", protect, updateAdminPassword);
router.put("/change-password", protect, updateAdminPassword);

// POST /api/admin/auth/send-password-reset-link - Send Firebase password reset verification link
router.post("/send-password-reset-link", protect, sendAdminPasswordResetLink);
router.post("/forgot-password", sendAdminPasswordResetLink);

module.exports = router;