import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  osProduct: { type: String, required: true }, // The OS product they are using when raising the ticket
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  resolution: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // The HQ team member handling it
}, { timestamps: true });

export default mongoose.model('SupportTicket', supportTicketSchema);
