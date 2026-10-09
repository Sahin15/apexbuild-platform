import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  type: { type: String, required: true }, // e.g., 'PAYMENT_REMINDER', 'SUBSCRIPTION_EXPIRING'
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
