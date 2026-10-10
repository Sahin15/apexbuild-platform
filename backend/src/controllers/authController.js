import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';
import EntitlementService from '../services/EntitlementService.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  user.passwordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

export const registerOrganization = async (req, res, next) => {
  try {
    const { orgName, orgEmail, userName, userEmail, password, phone, businessType, city, state, notes } = req.body;

    if (!orgName || !orgEmail || !userName || !userEmail || !password) {
      return next(new AppError('Please provide all required registration fields', 400));
    }

    const existingUser = await User.findOne({ email: userEmail.toLowerCase() });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const existingOrg = await Organization.findOne({ email: orgEmail.toLowerCase() });
    if (existingOrg) {
      return next(new AppError('Organization with this email already exists', 400));
    }

    // 1. Create Organization in pending status
    const organization = await Organization.create({
      name: orgName,
      email: orgEmail.toLowerCase(),
      phone: phone || '',
      city: city || '',
      state: state || '',
      notes: notes || '',
      ownerName: userName,
      businessType: businessType || 'CONTRACTOR',
      status: 'pending',
      registrationDate: new Date()
    });

    // 2. Create Owner User in pending status
    const user = await User.create({
      organizationId: organization._id,
      name: userName,
      email: userEmail.toLowerCase(),
      phone: phone || '',
      passwordHash: password,
      role: 'OWNER',
      status: 'pending'
    });

    // 3. Return confirmation response with Application ID (No JWT issued until Superadmin verifies)
    res.status(201).json({
      status: 'success',
      pendingVerification: true,
      message: 'Business registration application submitted successfully! Your account has entered the Superadmin Verification Queue.',
      data: {
        applicationId: organization._id,
        orgName: organization.name,
        businessType: organization.businessType,
        ownerName: user.name,
        userEmail: user.email,
        phone: user.phone,
        city: organization.city,
        state: organization.state,
        registrationDate: organization.registrationDate,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash').populate('organizationId');

    if (!user || !(await user.comparePassword(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Check if account or organization is pending verification
    if (user.status === 'pending' || user.organizationId?.status === 'pending') {
      return next(new AppError('Your business registration is currently under review in the ApexBuild Superadmin Verification Queue. You will be notified once verified and activated.', 403));
    }

    if (user.status !== 'active') {
      return next(new AppError('Account is inactive or suspended. Please contact ApexBuild support.', 401));
    }

    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('organizationId');
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const impersonateTenant = async (req, res, next) => {
  try {
    // 1. Verify caller is SUPER_ADMIN
    const callerOrg = await Organization.findById(req.user.organizationId);
    if ((!callerOrg || callerOrg.businessType !== 'SUPERADMIN') && req.user.platformRole !== 'SUPER_ADMIN') {
      return next(new AppError('Only Super Admins can impersonate tenants', 403));
    }

    const { targetOrgId } = req.params;

    // 2. Find the target organization and its owner
    const targetOrg = await Organization.findById(targetOrgId);
    if (!targetOrg) return next(new AppError('Target organization not found', 404));

    // Find any user in this org to impersonate, preferably an OWNER or ADMIN
    let targetUser = await User.findOne({ organizationId: targetOrgId, role: { $in: ['OWNER', 'ADMIN'] } });
    if (!targetUser) {
      targetUser = await User.findOne({ organizationId: targetOrgId });
    }
    
    if (!targetUser) return next(new AppError('No users found in this organization to impersonate', 404));

    // 3. Create high-security Audit Log
    await AuditLog.create({
      action: 'TENANT_IMPERSONATION_STARTED',
      adminId: req.user._id,
      entityType: 'Organization',
      entityId: targetOrgId,
      newValue: { targetUserId: targetUser._id, businessType: targetOrg.businessType },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 4. Issue token as the target user
    createSendToken(targetUser, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMyEntitlements = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId?._id || req.user?.organizationId;
    const data = await EntitlementService.getTenantEntitlements(orgId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
