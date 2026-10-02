const express = require("express");
const router = express.Router();
const { adminLogin, adminGoogleLogin } = require("../../controllers/admin/auth.controller");

// POST /api/admin/auth/login
router.post("/login", adminLogin);

// POST /api/admin/auth/google
router.post("/google", adminGoogleLogin);

// POST /api/admin/auth/firebase
router.post("/firebase", adminGoogleLogin);

module.exports = router;