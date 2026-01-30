const mongoose = require("mongoose");

const SecurityUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    securityId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "security" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityUser", SecurityUserSchema);
