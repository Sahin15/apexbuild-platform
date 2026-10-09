import SupportTicket from '../models/SupportTicket.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformSupportService {
  async getTickets(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    return await SupportTicket.find(filter)
      .populate('organizationId', 'name businessType')
      .populate('assignedTo', 'name')
      .sort('-createdAt')
      .lean();
  }

  async createTicket(data, adminId, ip, userAgent) {
    const org = await Organization.findById(data.organizationId);
    if (!org) throw new AppError('Organization not found', 404);

    const ticket = await SupportTicket.create({
      organizationId: data.organizationId,
      subject: data.subject,
      description: data.description,
      osProduct: org.businessType,
      priority: data.priority || 'MEDIUM'
    });

    await AuditLog.create({
      action: 'SUPPORT_TICKET_CREATED',
      adminId,
      entityType: 'SupportTicket',
      entityId: ticket._id,
      newValue: { subject: ticket.subject, priority: ticket.priority },
      ipAddress: ip,
      userAgent
    });

    return ticket;
  }

  async updateTicketStatus(id, status, adminId, ip, userAgent) {
    const ticket = await SupportTicket.findByIdAndUpdate(id, { status }, { new: true });
    if (!ticket) throw new AppError('Ticket not found', 404);

    await AuditLog.create({
      action: 'SUPPORT_TICKET_STATUS_UPDATED',
      adminId,
      entityType: 'SupportTicket',
      entityId: ticket._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    });

    return ticket;
  }
}

export default new PlatformSupportService();
