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

export const verifyBusinessAccount = async (req, res, next) => {
  try {
    const { osProductId, osPlanId, billingCycle = 'monthly', customPrice, discount = 0, setupFee = 0, internalNotes } = req.body;
    
    const org = await Organization.findById(req.params.id);
    if (!org) return next(new AppError('Business Account not found', 404));

    let plan = null;
    if (osPlanId) {
      plan = await OSPlan.findById(osPlanId);
    }

    const basePrice = plan ? (billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) : 0;
    const finalPrice = customPrice !== undefined && customPrice !== '' ? Number(customPrice) : basePrice;
    const discountAmount = Number(discount) || 0;
    const recurringAmount = Math.max(0, finalPrice - discountAmount);
    const implementationCost = Number(setupFee) || (plan?.setupFee || 0);

    org.status = 'active';
    org.approvalDate = new Date();
    if (internalNotes) org.internalNotes = internalNotes;
    if (plan) org.subscription = plan.name;
    await org.save();

    await User.updateMany({ organizationId: org._id }, { status: 'active' });

    let subscription = null;
    if (plan) {
      const nextBilling = new Date();
      if (billingCycle === 'yearly') {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }

      subscription = await Subscription.findOneAndUpdate(
        { organizationId: org._id },
        {
          organizationId: org._id,
          osProductId: osProductId || plan.osProductId,
          osPlanId: plan._id,
          billingCycle,
          basePrice,
          customPrice: finalPrice,
          discount: discountAmount,
          finalAmount: recurringAmount,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: nextBilling,
          createdBy: req.user._id,
          updatedBy: req.user._id
        },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_VERIFIED_AND_ACTIVATED',
      adminId: req.user._id,
      entityType: 'Organization',
      entityId: org._id,
      newValue: { status: 'active', planName: plan?.name, recurringAmount, implementationCost, internalNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Business account verified and activated successfully',
      data: { account: org, subscription }
    });
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
