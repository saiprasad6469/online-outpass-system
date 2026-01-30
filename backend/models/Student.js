const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    department: { type: String, required: true },
    yearSemester: { type: String, required: true },
    section: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
