// routes/adminOutpassRoutes.js
const express = require("express");
const router = express.Router();

const Outpass = require("../models/OutPass");
const Student = require("../models/Student");
const adminAuth = require("../middleware/adminAuthMiddleware");

/* =========================
   Helpers
========================= */
const normalizeStatus = (s) => String(s || "Pending").toLowerCase();
const clean = (v) => String(v ?? "").trim();

const getAdminDisplayName = (admin) =>
  admin?.adminName ||
  admin?.name ||
  admin?.fullName ||
  admin?.username ||
  admin?.adminId ||
  admin?.email ||
  "Admin";

/* =========================
   GET /api/admin/outpasses
========================= */
router.get("/outpasses", adminAuth, async (req, res) => {
  try {
    const department = clean(req.admin?.department);
    const year = clean(req.admin?.year);
    const section = clean(req.admin?.section);

    if (!department || !year || !section) {
      return res.status(400).json({
        success: false,
        message: "Admin token/middleware missing department/year/section",
        debug: { department, year, section },
      });
    }

    const outpasses = await Outpass.find({ department, year, section })
      .sort({ appliedAt: -1 })
      .lean();

    const studentIds = outpasses.map((op) => op.studentId).filter(Boolean);

    const students = await Student.find(
      { _id: { $in: studentIds } },
      "_id firstName lastName studentId"
    ).lean();

    const studentMap = {};
    for (const s of students) studentMap[String(s._id)] = s;

    const formatted = outpasses.map((op) => {
      const student = studentMap[String(op.studentId)];
      const st = normalizeStatus(op.status);

      const decisionBy =
        st === "approved"
          ? op.approvedBy || op.decisionBy || "-"
          : st === "rejected"
          ? op.rejectedBy || op.decisionBy || "-"
          : "-";

      const decisionAt =
        st === "approved"
          ? op.approvedAt || op.decisionAt || null
          : st === "rejected"
          ? op.rejectedAt || op.decisionAt || null
          : null;

      return {
        _id: op._id,
        studentName: student
          ? `${student.firstName} ${student.lastName}`
          : op.fullName || "Unknown",
        rollNo: student?.studentId || op.rollNumber || "-",
        outDate: op.appliedAt,

        status: op.status,
        reasonType: op.reasonType || "-",
        purpose: op.reasonType || "-",
        reason: op.reason || "-",

        decisionBy,
        decisionAt,

        // ✅ rejection reason from DB
        adminNotes: op.adminNotes || "",

        documents: Array.isArray(op.documents) ? op.documents : [],
      };
    });

    const stats = {
      totalRequests: formatted.length,
      approved: formatted.filter((x) => normalizeStatus(x.status) === "approved")
        .length,
      pending: formatted.filter((x) => normalizeStatus(x.status) === "pending")
        .length,
      rejected: formatted.filter((x) => normalizeStatus(x.status) === "rejected")
        .length,
    };

    return res.json({ success: true, outpasses: formatted, stats });
  } catch (err) {
    console.error("Admin outpass fetch error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin outpasses" });
  }
});

/* =========================
   PATCH /api/admin/outpasses/:id/notes
   ✅ Save adminNotes anytime
========================= */
router.patch("/outpasses/:id/notes", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const outpass = await Outpass.findById(id);
    if (!outpass) {
      return res
        .status(404)
        .json({ success: false, message: "Outpass not found" });
    }

    const adminDept = clean(req.admin?.department);
    const adminYear = clean(req.admin?.year);
    const adminSection = clean(req.admin?.section);

    // ✅ security check
    if (
      clean(outpass.department) !== adminDept ||
      clean(outpass.year) !== adminYear ||
      clean(outpass.section) !== adminSection
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed (dept/year/section mismatch)",
      });
    }

    outpass.adminNotes = clean(adminNotes);
    await outpass.save();

    return res.json({
      success: true,
      message: "Notes saved successfully",
      outpass: { _id: outpass._id, adminNotes: outpass.adminNotes || "" },
    });
  } catch (err) {
    console.error("PATCH notes error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   PATCH /api/admin/outpasses/:id/status
   ✅ Reject => adminNotes required and stored
========================= */
router.patch("/outpasses/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const allowed = ["Pending", "Approved", "Rejected"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const outpass = await Outpass.findById(id);
    if (!outpass) {
      return res
        .status(404)
        .json({ success: false, message: "Outpass not found" });
    }

    const adminDept = clean(req.admin?.department);
    const adminYear = clean(req.admin?.year);
    const adminSection = clean(req.admin?.section);

    // ✅ security check
    if (
      clean(outpass.department) !== adminDept ||
      clean(outpass.year) !== adminYear ||
      clean(outpass.section) !== adminSection
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed (dept/year/section mismatch)",
      });
    }

    const adminName = getAdminDisplayName(req.admin);

    // ✅ Reject must have reason
    if (status === "Rejected") {
      const reason = clean(adminNotes);
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason (adminNotes) is required when rejecting.",
        });
      }
      outpass.adminNotes = reason;
    }

    outpass.status = status;

    if (status === "Approved") {
      outpass.approvedBy = adminName;
      outpass.approvedAt = new Date();
      outpass.rejectedBy = null;
      outpass.rejectedAt = null;
    } else if (status === "Rejected") {
      outpass.rejectedBy = adminName;
      outpass.rejectedAt = new Date();
      outpass.approvedBy = null;
      outpass.approvedAt = null;
    } else {
      outpass.approvedBy = null;
      outpass.approvedAt = null;
      outpass.rejectedBy = null;
      outpass.rejectedAt = null;
    }

    outpass.decisionBy = status === "Pending" ? null : adminName;
    outpass.decisionAt = status === "Pending" ? null : new Date();

    await outpass.save();

    return res.json({
      success: true,
      message: "Status updated successfully",
      outpass: {
        _id: outpass._id,
        status: outpass.status,
        approvedBy: outpass.approvedBy || null,
        approvedAt: outpass.approvedAt || null,
        rejectedBy: outpass.rejectedBy || null,
        rejectedAt: outpass.rejectedAt || null,
        decisionBy: outpass.decisionBy || null,
        decisionAt: outpass.decisionAt || null,
        adminNotes: outpass.adminNotes || "",
      },
    });
  } catch (err) {
    console.error("PATCH status error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
