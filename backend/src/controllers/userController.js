import User from '../models/User.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId })
      .select('-password');
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'fail', message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      organizationId: req.user.organizationId
    });

    res.status(201).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, role, status, phone, licenseNumber, bloodGroup, address, emergencyContactName, emergencyContactPhone, password } = req.body;
    
    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to manage team' });
    }

    const updateData = { name, role, status, phone, licenseNumber, bloodGroup, address, emergencyContactName, emergencyContactPhone };
    if (password) {
      updateData.passwordHash = password; // In a real app we'd hash it first
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, licenseNumber, bloodGroup, address, emergencyContactName, emergencyContactPhone } = req.body;
    
    // Determine target user (allow admins to update others, or users to update themselves)
    const targetUserId = req.params.id || req.user._id;

    // Check permissions
    if (targetUserId !== req.user._id.toString() && req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this profile' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { name, phone, licenseNumber, bloodGroup, address, emergencyContactName, emergencyContactPhone },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};
