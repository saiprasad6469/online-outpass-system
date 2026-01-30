const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // MUST be before DB connection

const connectDB = require("./config/db");
connectDB(); // uses process.env.MONGO_URI

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

// Serve uploaded files (documents)
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/outpass", require("./routes/outpassRoutes"));
app.use("/api/admin", require("./routes/adminOutpassRoutes"));
const adminRoutes = require("./routes/adminRoutes");

// ...
app.use("/api/admin", adminRoutes);
const supportRoutes = require("./routes/supportRoutes");
app.use("/api/support", supportRoutes);
const securityRoutes = require("./routes/security.routes");
app.use("/api/security", securityRoutes);

const guardRoutes = require("./routes/guardRoutes");
app.use("/api/guard", guardRoutes);

/* ================= ROOT CHECK ================= */
app.get("/", (req, res) => {
  res.send("🚀 Online Student Out-Pass Backend is running");
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
