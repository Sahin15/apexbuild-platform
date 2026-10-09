import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if Superadmin organization exists
    let saOrg = await Organization.findOne({ businessType: 'SUPERADMIN' });
    if (!saOrg) {
      saOrg = await Organization.create({
        name: 'ApexBuild HQ',
        email: 'admin@apexbuild.com',
        businessType: 'SUPERADMIN',
        status: 'active'
      });
      console.log('Superadmin Organization created');
    } else {
      console.log('Superadmin Organization already exists');
    }

    // Check if Superadmin user exists
    let saUser = await User.findOne({ email: 'admin@apexbuild.com' });
    if (!saUser) {
      saUser = await User.create({
        organizationId: saOrg._id,
        name: 'Super Admin',
        email: 'admin@apexbuild.com',
        passwordHash: 'admin123', // Will be hashed by pre-save hook
        role: 'OWNER',
        platformRole: 'SUPER_ADMIN',
        status: 'active'
      });
      console.log('Superadmin User created');
    } else {
      // update platformRole if missing
      saUser.platformRole = 'SUPER_ADMIN';
      await saUser.save({ validateBeforeSave: false });
      console.log('Superadmin User updated');
    }

    console.log('Super Admin Seed Complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
