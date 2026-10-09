import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BOQ from '../src/models/BOQ.js';
import BOQItem from '../src/models/BOQItem.js';

dotenv.config();

const clean = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    // Find all BOQs
    const boqs = await BOQ.find().sort({ createdAt: 1 });
    console.log(`Found ${boqs.length} BOQs.`);
    
    // We only want 1 BOQ per project. 
    // Delete all BOQs except the first one for each project, and re-assign items to the first one.
    const projectBoqMap = {};
    for (const boq of boqs) {
      const pid = boq.projectId.toString();
      if (!projectBoqMap[pid]) {
        projectBoqMap[pid] = boq;
      } else {
        const masterBoq = projectBoqMap[pid];
        console.log(`Reassigning items from duplicate BOQ ${boq._id} to master BOQ ${masterBoq._id}`);
        await BOQItem.updateMany({ boqId: boq._id }, { boqId: masterBoq._id });
        await BOQ.findByIdAndDelete(boq._id);
      }
    }
    
    // Recalculate totals
    for (const pid in projectBoqMap) {
      const masterBoq = projectBoqMap[pid];
      const items = await BOQItem.find({ boqId: masterBoq._id });
      const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);
      masterBoq.totalAmount = totalAmount;
      await masterBoq.save();
    }

    console.log('BOQs cleaned up!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

clean();
