import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

dotenv.config();

const demoAccounts = [
  { type: 'CONTRACTOR', email: 'contractor@example.com', name: 'Contractor Demo' },
  { type: 'MATERIAL_SUPPLIER', email: 'supplier@example.com', name: 'Supplier Demo' },
  { type: 'CHICKEN_DISTRIBUTOR', email: 'distributor@example.com', name: 'Distributor Demo' },
  { type: 'SUPERADMIN', email: 'superadmin@example.com', name: 'Superadmin Demo' },
  { type: 'DIAGNOSTICS', email: 'diagnostic@example.com', name: 'Diagnostic Demo' },
  { type: 'PHARMACY', email: 'pharmacy@example.com', name: 'Pharmacy Demo' },
  { type: 'RESTAURANT', email: 'restaurant@example.com', name: 'Restaurant Demo' },
  { type: 'EDUCATION', email: 'education@example.com', name: 'Education Demo' },
];

const seedAllDemoUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Master Seeding...');

    for (const acc of demoAccounts) {
      // Clean up existing if any
      const existingOrg = await Organization.findOne({ email: acc.email });
      if (existingOrg) {
        await User.deleteMany({ organizationId: existingOrg._id });
        await Organization.deleteOne({ _id: existingOrg._id });
      }

      // Special case: Superadmin might not need an organization, but we create one for consistency
      // or handle it per backend logic. Let's create an org for everyone.
      const org = await Organization.create({
        name: acc.name,
        email: acc.email,
        businessType: acc.type,
        status: 'active'
      });

      await User.create({
        organizationId: org._id,
        name: `${acc.name} Admin`,
        email: acc.email,
        passwordHash: '123456', // Will be hashed by pre-save hook
        role: 'ADMIN',
        platformRole: acc.type === 'SUPERADMIN' ? 'SUPER_ADMIN' : 'NONE',
        status: 'active'
      });

      console.log(`Created: ${acc.email} | Password: 123456 | OS: ${acc.type}`);
    }

    console.log('Successfully seeded all demo accounts!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding databases:', error);
    process.exit(1);
  }
};

seedAllDemoUsers();
