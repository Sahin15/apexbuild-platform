import Organization from '../models/Organization.js';
import BusinessPartner from '../models/BusinessPartner.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const getBusinessAccounts = async (req, res, next) => {
  try {
    const orgs = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } }).populate('partnerId').sort('-createdAt');
    res.status(200).json({ status: 'success', data: { accounts: orgs } });
  } catch (error) { next(error); }
};

export const updateBusinessAccount = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!org) return next(new AppError('Business Account not found', 404));

    if (req.body.status) {
      const userStatus = req.body.status === 'active' ? 'active' : 'inactive';
      await User.updateMany({ organizationId: org._id }, { status: userStatus });
    }

    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_UPDATED',
      adminId: req.user._id,
      entityType: 'Organization',
      entityId: org._id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: { account: org } });
  } catch (error) { next(error); }
};

export const getBusinessPartners = async (req, res, next) => {
  try {
    const partners = await BusinessPartner.find().populate('organizationId').sort('-createdAt');
    res.status(200).json({ status: 'success', data: { partners } });
  } catch (error) { next(error); }
};

export const createBusinessPartner = async (req, res, next) => {
  try {
    const partner = await BusinessPartner.create(req.body);
    await Organization.findByIdAndUpdate(req.body.organizationId, { partnerId: partner._id });
    res.status(201).json({ status: 'success', data: { partner } });
  } catch (error) { next(error); }
};

export const getTeamMembers = async (req, res, next) => {
  try {
    const members = await User.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { members } });
  } catch (error) { next(error); }
};

export const createTeamMember = async (req, res, next) => {
  try {
    const { name, email, phone, platformRole, password } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already in use', 400));
    
    const member = await User.create({
      organizationId: req.user.organizationId,
      name,
      email,
      phone,
      passwordHash: password,
      role: 'ADMIN',
      platformRole: platformRole || 'NONE',
      status: 'active'
    });
    
    member.passwordHash = undefined;
    res.status(201).json({ status: 'success', data: { member } });
  } catch (error) { next(error); }
};
