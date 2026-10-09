import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';

dotenv.config();

const seedDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild');
    console.log('MongoDB connected for seeding...');

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Create Superadmin Org and User
    const superAdminOrg = await Organization.findOneAndUpdate(
      { email: 'admin@apexbuild.com' },
      { name: 'ApexBuild HQ', email: 'admin@apexbuild.com', businessType: 'SUPERADMIN', status: 'ACTIVE', subscriptionPlan: 'ENTERPRISE' },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'admin@apexbuild.com' },
      { 
        organizationId: superAdminOrg._id,
        name: 'Super Admin',
        email: 'admin@apexbuild.com',
        passwordHash,
        role: 'OWNER',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // 2. Create Contractor Org and User
    const contractorOrg = await Organization.findOneAndUpdate(
      { email: 'contractor@example.com' },
      { name: 'Demo Contractor Pvt Ltd', email: 'contractor@example.com', businessType: 'CONTRACTOR', status: 'ACTIVE', subscriptionPlan: 'PREMIUM' },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'contractor@example.com' },
      { 
        organizationId: contractorOrg._id,
        name: 'Contractor Admin',
        email: 'contractor@example.com',
        passwordHash,
        role: 'OWNER',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // 3. Create Supplier Org and User
    const supplierOrg = await Organization.findOneAndUpdate(
      { email: 'supplier@example.com' },
      { name: 'Demo Suppliers', email: 'supplier@example.com', businessType: 'MATERIAL_SUPPLIER', status: 'ACTIVE', subscriptionPlan: 'BASIC' },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'supplier@example.com' },
      { 
        organizationId: supplierOrg._id,
        name: 'Supplier Admin',
        email: 'supplier@example.com',
        passwordHash,
        role: 'OWNER',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDb();
