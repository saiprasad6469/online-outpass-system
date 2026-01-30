// routes/supportRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, email, studentId, issueType, message } = req.body || {};

    if (!name || !email || !studentId || !issueType || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, email, studentId, issueType, message).",
      });
    }

    // ✅ ensure env exists
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return res.status(500).json({
        success: false,
        message: "SMTP env missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS (and SMTP_PORT).",
      });
    }

    const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // ✅ app password
  },
});


    // ✅ verify SMTP connection (gives clear errors)
    await transporter.verify();

    const toEmail = process.env.SUPPORT_TO_EMAIL || "24e51a6708@hitam.org";

    await transporter.sendMail({
      from: `"Outpass Support" <${process.env.SMTP_USER}>`,
  to: "24e51a6708@hitam.org",
  replyTo: email,
  subject: `Support Request (${issueType}) - ${studentId}`,
      html: `
        <h2>New Support Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Student ID:</b> ${studentId}</p>
        <p><b>Issue Type:</b> ${issueType}</p>
        <hr/>
        <p style="white-space:pre-wrap;"><b>Message:</b><br/>${message}</p>
      `,
    });

    return res.json({ success: true, message: "Support request sent successfully." });
  } catch (err) {
    console.error("Support email error:", err);
    return res.status(500).json({
      success: false,
      // ✅ this will show the exact reason in frontend too
      message: err?.message || "Internal Server Error while sending email",
    });
  }
});

module.exports = router;
