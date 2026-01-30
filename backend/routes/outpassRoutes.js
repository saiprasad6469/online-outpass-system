// routes/outpassRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const Outpass = require("../models/OutPass");
const Student = require("../models/Student");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

// Optional: file filter (PDF/JPG/PNG)
const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, PNG are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ================= APPLY OUTPASS ================= */
router.post("/apply", authMiddleware, upload.array("documents", 5), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const documents = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
    }));

    const outpass = new Outpass({
      fullName: req.body.fullName,
      rollNumber: req.body.rollNumber,
      department: req.body.department,
      year: req.body.year,
      section: req.body.section,

      reasonType: req.body.reasonType,
      reason: req.body.reason,

      contactNumber: req.body.contactNumber,

      // store ObjectId
      studentId: student._id,
      studentEmail: student.email || req.body.studentEmail || "",

      documents,
    });

    await outpass.save();

    return res.json({
      success: true,
      message: "Out-pass applied successfully",
      outpassId: outpass._id,
    });
  } catch (err) {
    console.error("Apply outpass error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to apply out-pass",
    });
  }
});

/* ================= OUTPASS HISTORY =================
   GET /api/outpass/history
   Returns outpasses for logged-in student
==================================================== */
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("firstName lastName studentId");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const outpasses = await Outpass.find({ studentId: req.user.id }).sort({ appliedAt: -1 }).lean();

    const formatted = outpasses.map((op) => {
      const statusLower = String(op.status || "Pending").toLowerCase();

      // ✅ Decision fields (works for approved + rejected)
      const decisionBy =
        op.decisionBy ||
        (statusLower === "approved" ? op.approvedBy : null) ||
        (statusLower === "rejected" ? op.rejectedBy : null) ||
        "-";

      const decisionAt =
        op.decisionAt ||
        (statusLower === "approved" ? op.approvedAt : null) ||
        (statusLower === "rejected" ? op.rejectedAt : null) ||
        null;

      return {
        _id: op._id,
        outpassId: op.outpassId || String(op._id).slice(-6).toUpperCase(),

        // ✅ Student details (for your modal)
        fullName: op.fullName || `${student.firstName} ${student.lastName}`,
        rollNumber: op.rollNumber || student.studentId || "-",
        studentId: String(op.studentId || req.user.id),

        reasonType: op.reasonType || "-",
        reason: op.reason || "-",
        contactNumber: op.contactNumber || "-",

        status: statusLower,
        appliedAt: op.appliedAt,

        // ✅ return both specific + generic decision fields
        approvedBy: op.approvedBy || null,
        approvedAt: op.approvedAt || null,
        rejectedBy: op.rejectedBy || null,
        rejectedAt: op.rejectedAt || null,

        decisionBy,
        decisionAt,

        documents: Array.isArray(op.documents) ? op.documents : [],
      };
    });

    return res.json({ success: true, outpasses: formatted });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

/* ================= CANCEL OUTPASS =================
   DELETE /api/outpass/cancel/:id
   Deletes ONLY if pending + belongs to logged student
==================================================== */
router.delete("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const outpass = await Outpass.findById(id);
    if (!outpass) {
      return res.status(404).json({ success: false, message: "Out-pass not found" });
    }

    // ✅ owner check
    if (String(outpass.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // ✅ only pending can be cancelled
    if (String(outpass.status || "").toLowerCase() !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending out-pass can be cancelled",
      });
    }

    await Outpass.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Out-pass cancelled and deleted successfully",
    });
  } catch (error) {
    console.error("Cancel/Delete outpass error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling out-pass",
    });
  }
});

// ✅ PASTE HERE
router.get("/outpasses", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const outpasses = await Outpass.find(filter).sort({ approvedAt: -1 }).lean();

    res.json({ success: true, outpasses });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
