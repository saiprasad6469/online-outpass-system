// routes/adminOutpassRoutes.js
const express = require("express");
const router = express.Router();

const Outpass = require("../models/OutPass");
const Student = require("../models/Student"); // only for name/roll mapping (optional)
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");


/* =========================
   Helpers
========================= */
const normalizeStatus = (s) => String(s || "Pending").toLowerCase();

const getAdminDisplayName = (admin) => {
  return (
    admin?.adminName || // ✅ your DB field
    admin?.name ||
    admin?.fullName ||
    admin?.username ||
    admin?.adminId ||
    admin?.email ||
    "Admin"
  );
};

const clean = (v) => String(v ?? "").trim();

/* =========================
   GET ALL OUTPASSES (ADMIN)
   GET /api/admin/outpasses
   ✅ Filters by admin.department + admin.year + admin.section
========================= */
router.get("/outpasses", adminAuth, async (req, res) => {
  try {
    const department = clean(req.admin?.department);
    const year = clean(req.admin?.year);
    const section = clean(req.admin?.section);

    // ✅ If any is missing, filtering can't work
    if (!department || !year || !section) {
      return res.status(400).json({
        success: false,
        message: "Admin token/middleware missing department/year/section",
        debug: { department, year, section },
      });
    }

    // ✅ MAIN FILTER: compare admin dept/year/section with outpass dept/year/section
    const outpasses = await Outpass.find({ department, year, section })
      .sort({ appliedAt: -1 })
      .lean();

    // ✅ OPTIONAL: Get student names/roll from Student collection (not filtering)
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

        // you were showing appliedAt as outDate in UI
        outDate: op.appliedAt,
        status: op.status,

        reasonType: op.reasonType || "-",
        purpose: op.reasonType || "-",
        reason: op.reason || "-",

        decisionBy,
        decisionAt,

        documents: Array.isArray(op.documents) ? op.documents : [],
      };
    });

    const stats = {
      totalRequests: formatted.length,
      approved: formatted.filter((x) => normalizeStatus(x.status) === "approved").length,
      pending: formatted.filter((x) => normalizeStatus(x.status) === "pending").length,
      rejected: formatted.filter((x) => normalizeStatus(x.status) === "rejected").length,
    };

    return res.json({ success: true, outpasses: formatted, stats });
  } catch (err) {
    console.error("Admin outpass fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin outpasses",
    });
  }
});

/* =========================
   UPDATE STATUS (APPROVE/REJECT/PENDING)
   PATCH /api/admin/outpasses/:id/status
   ✅ Only allow update if outpass dept/year/section matches admin dept/year/section
========================= */
router.patch("/outpasses/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["Pending", "Approved", "Rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const outpass = await Outpass.findById(id);
    if (!outpass) {
      return res.status(404).json({ success: false, message: "Outpass not found" });
    }

    const adminDept = clean(req.admin?.department);
    const adminYear = clean(req.admin?.year);
    const adminSection = clean(req.admin?.section);

    // ✅ STRICT SECURITY CHECK using Outpass fields (NOT Student)
    if (
      clean(outpass.department) !== adminDept ||
      clean(outpass.year) !== adminYear ||
      clean(outpass.section) !== adminSection
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to update this outpass (dept/year/section mismatch)",
      });
    }

    const adminName = getAdminDisplayName(req.admin);

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
      },
    });
  } catch (err) {
    console.error("PATCH status error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
