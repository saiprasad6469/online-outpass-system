const mongoose = require('mongoose');

const outpassSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },

  reasonType: { type: String, required: true },
  reason: { type: String, required: true },

  contactNumber: { type: String, required: true },

  studentId: { type: String, required: true },
 

  documents: [
    {
      fileName: String,
      filePath: String,
      fileType: String,
      fileSize: Number
    }
  ],

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },

  appliedAt: {
    type: Date,
    default: Date.now
  },
// Decision fields (add these in schema)
approvedBy: { type: String, default: null },
approvedAt: { type: Date, default: null },
rejectedBy: { type: String, default: null },
rejectedAt: { type: Date, default: null },

// models/OutPass.js (add this field inside schema)
outStatus: {
  type: String,
  enum: ["Pending", "Approved"],
  default: "Pending",
},




});



module.exports = mongoose.model('Outpass', outpassSchema);
