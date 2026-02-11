const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
connectDB();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allow your Render frontend + localhost
const allowedOrigins = [
  "http://localhost:3000",
  "https://online-outpass-system-1.onrender.com", // ✅ frontend
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman/server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight OPTIONS (avoid path-to-regexp issue)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/outpass", require("./routes/outpassRoutes"));

// ✅ Admin auth routes
app.use("/api/admin", require("./routes/adminRoutes"));

// ✅ Admin outpass routes (THIS FIXES YOUR 404)
app.use("/api/admin", require("./routes/adminOutpassRoutes"));

app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/security", require("./routes/security.routes"));
app.use("/api/guard", require("./routes/guardRoutes"));

/* ================= ROOT CHECK ================= */
app.get("/", (req, res) => {
  return res.status(200).json({ ok: true, message: "Backend running" });
});

/* ================= 404 JSON ================= */
app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Route not found" });
});

/* ================= ERROR JSON ================= */
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  return res.status(500).json({ success: false, message: "Server error" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
