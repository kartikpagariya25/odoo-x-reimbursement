const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  action: String,
  details: mongoose.Schema.Types.Mixed

}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);