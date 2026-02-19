const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      studentId,
      phone,
      password,
      confirmPassword,
      department,
      yearSemester,
      section,
    } = req.body;

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

    if (!firstName || !lastName || !studentId || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const cleanStudentId = String(studentId).trim();

    const existingStudent = await Student.findOne({ studentId: cleanStudentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student ID already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await Student.create({
      firstName,
      lastName,
      studentId: cleanStudentId,
      phone: phone || "",
      password: hashedPassword,
      department,
      yearSemester,
      section,
    });

    const token = jwt.sign(
      { id: newStudent._id, studentId: newStudent.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      user: {
        id: newStudent._id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        studentId: newStudent.studentId,
        department: newStudent.department,
        yearSemester: newStudent.yearSemester,
        section: newStudent.section,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    // ✅ Handle Mongo duplicate key error
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Student ID already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and password are required",
      });
    }

    const cleanStudentId = String(studentId).trim();

    const student = await Student.findOne({ studentId: cleanStudentId });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid Student ID or password",
      });
    }

    if (typeof student.password !== "string") {
      console.error("❌ Stored password is not a string for:", cleanStudentId, student.password);
      return res.status(500).json({
        success: false,
        message: "Login configuration error (invalid stored password)",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Student ID or password",
      });
    }

    const token = jwt.sign(
      { id: student._id, studentId: student.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        department: student.department,
        yearSemester: student.yearSemester,
        section: student.section,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

module.exports = router;
