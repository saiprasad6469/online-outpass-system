const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    adminName: { type: String, required: true, trim: true },
    adminId: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
