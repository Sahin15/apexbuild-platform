import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Organization.deleteMany({});
    await User.deleteMany({});

    // Create Organization
    const org = await Organization.create({
      name: 'Apex Construction',
      email: 'contact@apexbuild.com',
      phone: '+91 9876543210',
      address: '123 Tech Park',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091'
    });

    console.log('Organization created:', org.name);

    // Create Admin User
    const admin = await User.create({
      organizationId: org._id,
      name: 'Admin User',
      email: 'admin@apexbuild.com',
      passwordHash: 'password', // Will be hashed by pre-save hook
      role: 'ADMIN',
      status: 'active'
    });

    console.log('Admin user created:', admin.email);
    console.log('Password is: password');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
