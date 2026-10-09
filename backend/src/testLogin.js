import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const user = await User.findOne({ email: 'superadmin@apexbuild.com' }).select('+passwordHash');
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    const isMatch = await bcrypt.compare('Superadmin@123', user.passwordHash);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Fixing password directly...');
      user.passwordHash = await bcrypt.hash('Superadmin@123', 12);
      await user.save(); // Don't trigger pre-save again if it's broken, wait, pre-save hook checks isModified.
      console.log('Password fixed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

testLogin();
