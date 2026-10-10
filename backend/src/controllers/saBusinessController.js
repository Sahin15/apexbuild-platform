import Organization from '../models/Organization.js';
import BusinessPartner from '../models/BusinessPartner.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Subscription from '../models/Subscription.js';
import OSPlan from '../models/OSPlan.js';

export const getBusinessAccounts = async (req, res, next) => {
  try {
    const orgs = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } }).populate('partnerId').sort('-createdAt');
    res.status(200).json({ status: 'success', data: { accounts: orgs } });
  } catch (error) { next(error); }
};

export const createBusinessAccount = async (req, res, next) => {
  try {
    const { orgName, orgEmail, businessType, ownerName, ownerEmail, phone, password, osProductId, osPlanId } = req.body;

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) return next(new AppError('Owner email already in use', 400));

    // 1. Create Organization
    const organization = await Organization.create({
      name: orgName,
      email: orgEmail,
      businessType: businessType || 'CONTRACTOR',
      status: 'active'
    });

    // 2. Create Owner User
    const user = await User.create({
      organizationId: organization._id,
      name: ownerName,
      email: ownerEmail,
      phone,
      passwordHash: password,
      role: 'OWNER',
      status: 'active'
    });
    user.passwordHash = undefined;

    // 3. Create Subscription if Plan is provided
    let subscription = null;
    if (osProductId && osPlanId) {
      const plan = await OSPlan.findById(osPlanId);
      if (plan) {
        subscription = await Subscription.create({
          organizationId: organization._id,
          osProductId,
          osPlanId,
          status: 'ACTIVE',
          billingCycle: 'monthly',
          basePrice: plan.monthlyPrice,
          finalAmount: plan.monthlyPrice,
          startDate: new Date(),
          renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          createdBy: req.user._id
        });
      }
    }

    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_CREATED',
      adminId: req.user._id,
      entityType: 'Organization',
      entityId: organization._id,
      newValue: { orgName, ownerEmail, osPlanId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: { account: organization, owner: user, subscription } });
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
