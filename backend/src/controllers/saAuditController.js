import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('adminId', 'name email').sort('-createdAt').limit(200);
    res.status(200).json({ status: 'success', data: { logs } });
  } catch (error) { next(error); }
};
