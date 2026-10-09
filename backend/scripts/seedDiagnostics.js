import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

dotenv.config();

const seedDiagnostics = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Diagnostics seeding...');

    // Optionally check if we want to drop only diagnostics (we'll just delete existing diagnostics demo for safety)
    const existingOrg = await Organization.findOne({ email: 'diagnostics@example.com' });
    if (existingOrg) {
      await User.deleteMany({ organizationId: existingOrg._id });
      await Organization.deleteOne({ _id: existingOrg._id });
      console.log('Removed existing demo diagnostics organization.');
    }

    // Create Organization
    const org = await Organization.create({
      name: 'Apex Diagnostics Demo',
      legalName: 'Apex Diagnostics Private Limited',
      email: 'diagnostics@example.com',
      phone: '+91 9876543210',
      address: '123 Health Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      businessType: 'DIAGNOSTICS'
    });

    console.log('Organization created:', org.name);

    // Create Admin User
    const admin = await User.create({
      organizationId: org._id,
      name: 'Diagnostics Admin',
      email: 'diagnostics@example.com',
      passwordHash: '123456', // Will be hashed by pre-save hook
      role: 'ADMIN',
      status: 'active'
    });

    console.log('Admin user created:', admin.email);
    console.log('Password is: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding diagnostics database:', error);
    process.exit(1);
  }
};

seedDiagnostics();
