import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true }, // e.g., 'Organization', 'Subscription', 'Payment'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  oldValue: { type: Object },
  newValue: { type: Object },
  reason: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
