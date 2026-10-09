import SupportTicket from '../models/SupportTicket.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    const ticket = await SupportTicket.create({
      organizationId: req.user.organizationId,
      requestedBy: req.user._id,
      subject,
      description,
      priority,
      osProduct: org.businessType
    });

    res.status(201).json({ status: 'success', data: { ticket } });
  } catch (error) { next(error); }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { tickets } });
  } catch (error) { next(error); }
};
