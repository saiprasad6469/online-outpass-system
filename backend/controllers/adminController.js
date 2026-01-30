const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const signToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
};

// POST /api/admin/register
exports.registerAdmin = async (req, res) => {
  try {
    const { adminName, adminId, email, phone, password, department, year, section } = req.body;

    if (!adminName || !adminId || !email || !phone || !password || !department || !year || !section) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields" });
    }

    // Must end with @hitam.org (same as frontend)
    if (!String(email).toLowerCase().endsWith("@hitam.org")) {
      return res.status(400).json({
        success: false,
        message: "Please use HITAM official email ending with @hitam.org",
      });
    }

    // Check existing email/adminId
    const existingEmail = await Admin.findOne({ email: String(email).toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Admin with this email already exists" });
    }

    const existingAdminId = await Admin.findOne({ adminId: adminId.trim() });
    if (existingAdminId) {
      return res.status(409).json({ success: false, message: "Admin with this adminId already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      adminName,
      adminId: adminId.trim(),
      email: String(email).toLowerCase(),
      phone,
      password: hashed,
      department,
      year,
      section,
      role: "admin",
    });

    const token = signToken(admin);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token,
      user: {
        id: admin._id,
        adminName: admin.adminName,
        adminId: admin.adminId,
        email: admin.email,
        phone: admin.phone,
        department: admin.department,
        year: admin.year,
        section: admin.section,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("registerAdmin error:", err);
    return res.status(500).json({ success: false, message: "Server error while registering admin" });
  }
};

// POST /api/admin/login
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body; // frontend sends username, password

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Please fill in all fields" });
    }

    // allow login using email OR adminId
    const query = String(username).includes("@")
      ? { email: String(username).toLowerCase() }
      : { adminId: String(username).trim() };

    const admin = await Admin.findOne(query);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const token = signToken(admin);

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: admin._id,
        adminName: admin.adminName,
        adminId: admin.adminId,
        email: admin.email,
        phone: admin.phone,
        department: admin.department,
        year: admin.year,
        section: admin.section,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("loginAdmin error:", err);
    return res.status(500).json({ success: false, message: "Server error while logging in" });
  }
};

// GET /api/admin/me (optional)
exports.getMeAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    return res.json({ success: true, user: admin });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
