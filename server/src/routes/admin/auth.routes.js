const express = require("express");
const router = express.Router();
const { adminLogin, adminGoogleLogin, adminRefreshToken } = require("../../controllers/admin/auth.controller");

// POST /api/admin/auth/login
router.post("/login", adminLogin);

// POST /api/admin/auth/google
router.post("/google", adminGoogleLogin);

// POST /api/admin/auth/firebase
router.post("/firebase", adminGoogleLogin);

// POST /api/admin/auth/refresh-token  &  /api/admin/auth/refresh
router.post("/refresh-token", adminRefreshToken);
router.post("/refresh", adminRefreshToken);

module.exports = router;