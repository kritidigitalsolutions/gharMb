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
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "1d" }
    );

    // 7. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};