const express = require("express");
const Student = require("../models/Student");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ================= CHECK AUTH ================= */
router.get("/check-auth", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    if (!student) {
      return res.json({
        success: false,
        isAuthenticated: false,
      });
    }

      // ✅ map yearSemester -> year (so frontend works)
    const user = {
      ...student.toObject(),
      year: student.yearSemester,  // 🔥 key fix
    };

    res.json({
      success: true,
      isAuthenticated: true,
      user: student, // 👈 ApplyPass.jsx expects `user`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      isAuthenticated: false,
    });
  }
});

/* ================= GET PROFILE ================= */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

     const user = {
      ...student.toObject(),
      year: student.yearSemester, // 🔥 key fix
    };

    res.json({
      success: true,
      user: student, // 👈 important
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ================= UPDATE PROFILE ================= */
/* ApplyPass.jsx calls: /api/students/update-profile */
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, department, year, section } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, department, year, section },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ================= LOGOUT ================= */
router.post("/logout", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/* ================= GET SECTIONS ================= */
router.get("/sections", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      sections: ["A", "B", "C", "D", "E", "F"],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sections",
    });
  }
});

module.exports = router;
