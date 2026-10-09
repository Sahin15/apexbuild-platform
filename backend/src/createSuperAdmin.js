import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Ensure Superadmin organization exists
    let saOrg = await Organization.findOne({ businessType: 'SUPERADMIN' });
    if (!saOrg) {
      saOrg = await Organization.create({
        name: 'ApexBuild HQ',
        email: 'superadmin@apexbuild.com',
        businessType: 'SUPERADMIN',
        status: 'active'
      });
      console.log('Superadmin Organization created');
    } else {
      console.log('Superadmin Organization already exists');
      saOrg.email = 'superadmin@apexbuild.com';
      saOrg.status = 'active'; // Fix uppercase issue if present in DB
      await saOrg.save();
    }

    // Delete the previous incorrect admin if it exists
    await User.deleteOne({ email: 'admin@apexbuild.com' });

    // Check if new Superadmin user exists
    let saUser = await User.findOne({ email: 'superadmin@apexbuild.com' });
    if (!saUser) {
      // The User model usually has a pre-save hook for password hashing,
      // so we pass the plain password and let the model hash it.
      saUser = await User.create({
        organizationId: saOrg._id,
        name: 'Super Admin',
        email: 'superadmin@apexbuild.com',
        passwordHash: 'Superadmin@123',
        role: 'OWNER',
        platformRole: 'SUPER_ADMIN',
        status: 'active'
      });
      console.log('Superadmin User created successfully!');
    } else {
      // Update password
      saUser.passwordHash = 'Superadmin@123';
      saUser.platformRole = 'SUPER_ADMIN';
      await saUser.save();
      console.log('Superadmin User updated successfully!');
    }

    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
