const express = require("express");
const router = express.Router();
const Outpass = require("../models/OutPass");
// const securityAuth = require("../middleware/securityAuthMiddleware"); // if you have

// ✅ Get ONLY today's APPROVED outpasses (based on approvedAt)
router.get("/dashboard", /*securityAuth,*/ async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const outpasses = await Outpass.find({
      status: "Approved",
      approvedAt: { $gte: start, $lte: end },
    })
      .sort({ approvedAt: -1 })
      .lean();

    // ✅ auto-fill outStatus for old records that don't have it
    const fixed = outpasses.map((x) => ({
      ...x,
      outStatus: x.outStatus || "Pending",
    }));

    return res.json({
      success: true,
      outpasses: fixed,
      stats: {
        todayOut: fixed.length,
        monthRequests: 0,
        todayReturn: 0,
        verifiedToday: 0,
        checkedOutToday: fixed.filter((x) => x.outStatus === "Approved").length,
        systemStatus: "All Systems Normal",
      },
    });
  } catch (err) {
    console.error("guard dashboard error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Update outStatus (Pending -> Approved)
router.patch("/outpasses/:id/out-status", /*securityAuth,*/ async (req, res) => {
  try {
    const { id } = req.params;
    const { outStatus } = req.body;

    if (!["Pending", "Approved"].includes(outStatus)) {
      return res.status(400).json({ success: false, message: "Invalid outStatus" });
    }

    const updated = await Outpass.findByIdAndUpdate(
      id,
      { outStatus },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Outpass not found" });
    }

    return res.json({ success: true, outpass: updated });
  } catch (err) {
    console.error("update outStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get ALL outpasses (optionally filter by status)
router.get("/outpasses", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && String(status).trim()) {
      // case-insensitive exact match (Approved/approved)
      filter.status = { $regex: `^${String(status).trim()}$`, $options: "i" };
    }

    const outpasses = await Outpass.find(filter)
      .sort({ approvedAt: -1, appliedAt: -1, _id: -1 })
      .lean();

    // auto-fill outStatus for old records
    const fixed = outpasses.map((x) => ({
      ...x,
      outStatus: x.outStatus || "Pending",
    }));

    return res.json({ success: true, count: fixed.length, outpasses: fixed });
  } catch (err) {
    console.error("guard get outpasses error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Search TODAY's outpasses by outpassId or rollNumber (ONLY outStatus Pending)
router.get("/verify/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "q is required" });
    }

    // Today range (server timezone)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // match by _id OR rollNumber (case-insensitive)
    const or = [];
    // if q looks like a mongo id, allow _id direct match
    if (/^[0-9a-fA-F]{24}$/.test(q)) {
      or.push({ _id: q });
    }
    or.push({ rollNumber: { $regex: `^${q}$`, $options: "i" } });

    const outpass = await Outpass.findOne({
      $and: [
        { status: "Approved" },                 // ✅ only approved
        { approvedAt: { $gte: start, $lte: end } }, // ✅ only today's
        { outStatus: { $in: [null, undefined, "", "Pending"] } }, // ✅ pending only (also supports old data)
        { $or: or },
      ],
    }).lean();

    if (!outpass) {
      return res.json({
        success: true,
        found: false,
        message: "No matching TODAY approved outpass with Pending outStatus.",
      });
    }

    return res.json({
      success: true,
      found: true,
      outpass: { ...outpass, outStatus: outpass.outStatus || "Pending" },
    });
  } catch (err) {
    console.error("verify search error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
