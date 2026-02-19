// models/OutPass.js
const mongoose = require("mongoose");

const outpassSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    section: { type: String, required: true },

    reasonType: { type: String, required: true },
    reason: { type: String, required: true },

    contactNumber: { type: String, required: true },

    // ✅ You are storing ObjectId as string from apply route; keep as String for now.
    // If you want best practice: change to mongoose.Schema.Types.ObjectId
    studentId: { type: String, required: true },

    documents: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
        fileSize: Number,
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    appliedAt: { type: Date, default: Date.now },

    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },

    rejectedBy: { type: String, default: null },
    rejectedAt: { type: Date, default: null },

    // ✅ these were used in routes but not in schema before
    decisionBy: { type: String, default: null },
    decisionAt: { type: Date, default: null },

    // optional existing field
    outStatus: {
      type: String,
      enum: ["Pending", "Approved"],
      default: "Pending",
    },

    // ✅ THIS is your rejection reason field
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Outpass", outpassSchema);
