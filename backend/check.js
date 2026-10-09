import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/models/Attendance.js';
import Worker from './src/models/Worker.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const sultan = await Worker.findOne({ name: /sultan/i });
    if (!sultan) {
      console.log('Sultan not found in workers');
    } else {
      console.log('Sultan:', sultan);
      const atts = await Attendance.find({ workerId: sultan._id });
      console.log('Sultan Attendances:', atts);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
