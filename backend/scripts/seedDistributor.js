import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

dotenv.config();

const seedDistributor = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding Chicken Distributor...');

    // Clear existing distributor data
    const existingOrg = await Organization.findOne({ email: 'poultry@apexbuild.com' });
    if (existingOrg) {
        await User.deleteMany({ organizationId: existingOrg._id });
        await Organization.deleteOne({ _id: existingOrg._id });
    }

    // Create Organization
    const org = await Organization.create({
      name: 'Mondal Poultry Distribution',
      email: 'poultry@apexbuild.com',
      phone: '+91 9999999999',
      address: 'Shop No 1, Market Area',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
      businessType: 'CHICKEN_DISTRIBUTOR'
    });

    console.log('Organization created:', org.name);

    // Create Admin User
    const admin = await User.create({
      organizationId: org._id,
      name: 'Sahin Distributor',
      email: 'distributor@example.com',
      passwordHash: '123456', // Will be hashed by pre-save hook
      role: 'OWNER',
      status: 'active'
    });

    console.log('Admin user created:', admin.email);
    console.log('Password is: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDistributor();
