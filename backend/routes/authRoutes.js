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

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student ID already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      firstName,
      lastName,
      studentId,
      phone,
      password: hashedPassword,
      department,
      yearSemester,
      section,
    });

    await newStudent.save();

    const token = jwt.sign(
      { id: newStudent._id, studentId: newStudent.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      user: {
        id: newStudent._id,
        firstName,
        lastName,
        studentId,
        department,
        yearSemester,
        section,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and password are required",
      });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid Student ID or password",
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

    res.json({
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
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

module.exports = router;
