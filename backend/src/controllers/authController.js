import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

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
    const { orgName, orgEmail, userName, userEmail, password, phone, businessType } = req.body;

    // 1. Create Organization
    const organization = await Organization.create({
      name: orgName,
      email: orgEmail,
      businessType: businessType || 'CONTRACTOR'
    });

    // 2. Create Owner User
    const user = await User.create({
      organizationId: organization._id,
      name: userName,
      email: userEmail,
      phone,
      passwordHash: password,
      role: 'OWNER'
    });

    const populatedUser = await User.findById(user._id).populate('organizationId');

    createSendToken(populatedUser, 201, res);
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

    const user = await User.findOne({ email }).select('+passwordHash').populate('organizationId');

    if (!user || !(await user.comparePassword(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (user.status !== 'active') {
      return next(new AppError('Account is inactive. Please contact support.', 401));
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
