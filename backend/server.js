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

// ✅ Single CORS config (no duplicates)
const allowedOrigins = [
  "http://localhost:3000",
  "https://online-outpass-system.onrender.com",
  "https://online-outpass-system-1.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow Postman/server-to-server (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ IMPORTANT for preflight
app.options("*", cors());


// Serve uploaded files
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/outpass", require("./routes/outpassRoutes"));

// ✅ Use /api/admin only ONCE (merge routes inside this router)
app.use("/api/admin", require("./routes/adminRoutes"));

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
