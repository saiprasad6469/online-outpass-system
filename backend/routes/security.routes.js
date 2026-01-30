const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SecurityUser = require("../models/SecurityUser");

// ✅ SIGNUP
// POST /api/security/signup
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, securityId, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !securityId || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const existingId = await SecurityUser.findOne({ securityId: securityId.trim() });
    if (existingId) return res.status(409).json({ success: false, message: "Security ID already exists." });

    const existingEmail = await SecurityUser.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) return res.status(409).json({ success: false, message: "Email already exists." });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await SecurityUser.create({
      firstName,
      lastName,
      securityId,
      email,
      passwordHash,
      role: "security",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, securityId: user.securityId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Security account created successfully.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        securityId: user.securityId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ LOGIN
// POST /api/security/login
router.post("/login", async (req, res) => {
  try {
    const { securityId, password } = req.body;

    if (!securityId || !password) {
      return res.status(400).json({ success: false, message: "Security ID and password are required." });
    }

    const user = await SecurityUser.findOne({ securityId: securityId.trim() });
    if (!user) return res.status(401).json({ success: false, message: "Invalid Security ID or password." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid Security ID or password." });

    const token = jwt.sign(
      { id: user._id, role: user.role, securityId: user.securityId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        securityId: user.securityId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});



module.exports = router;
