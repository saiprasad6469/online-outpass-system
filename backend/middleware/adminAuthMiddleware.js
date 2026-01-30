const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // ✅ your Admin model

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded should contain adminId or _id
    const admin =
      (decoded.id && (await Admin.findById(decoded.id).select("-password"))) ||
      (decoded._id && (await Admin.findById(decoded._id).select("-password"))) ||
      (decoded.adminId &&
        (await Admin.findOne({ adminId: decoded.adminId }).select("-password"))) ||
      (decoded.email &&
        (await Admin.findOne({ email: decoded.email }).select("-password")));

    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    // ✅ now req.admin has real DB fields: department/year/section
    req.admin = admin;

    next();
  } catch (err) {
    console.error("adminAuth error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = adminAuth;
