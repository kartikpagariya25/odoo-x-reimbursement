const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.Mixed, // Can be user ID, expense ID, rule ID, etc.
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Additional info about the action
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
