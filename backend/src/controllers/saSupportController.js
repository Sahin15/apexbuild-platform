import SupportTicket from '../models/SupportTicket.js';
import AuditLog from '../models/AuditLog.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

export const getTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().populate('organizationId requestedBy assignedTo').sort('-createdAt');
    res.status(200).json({ status: 'success', data: { tickets } });
  } catch (error) { next(error); }
};

export const createTicket = async (req, res, next) => {
  try {
    const { organizationId, subject, description, priority } = req.body;
    
    const org = await Organization.findById(organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    const ticket = await SupportTicket.create({
      organizationId,
      requestedBy: req.user._id, // Admin creating it
      subject,
      description,
      priority,
      osProduct: org.businessType
    });

    await AuditLog.create({
      action: 'SUPPORT_TICKET_CREATED_BY_ADMIN',
      adminId: req.user._id,
      entityType: 'SupportTicket',
      entityId: ticket._id,
      newValue: { subject, organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: { ticket } });
  } catch (error) { next(error); }
};

export const updateTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) return next(new AppError('Ticket not found', 404));

    await AuditLog.create({
      action: 'SUPPORT_TICKET_UPDATED',
      adminId: req.user._id,
      entityType: 'SupportTicket',
      entityId: ticket._id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: { ticket } });
  } catch (error) { next(error); }
};
