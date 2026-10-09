import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OSProduct from './src/models/OSProduct.js';

dotenv.config();

const defaultOSProducts = [
  { name: 'Contractor OS', slug: 'contractor', description: 'Complete management system for construction contractors.', status: 'production' },
  { name: 'Supplier OS', slug: 'supplier', description: 'B2B marketplace and ERP for building material suppliers.', status: 'production' },
  { name: 'Diagnostics OS', slug: 'diagnostics', description: 'Advanced LIS and patient management for pathology labs.', status: 'production' },
  { name: 'Distributor OS', slug: 'distributor', description: 'Logistics and supply chain management for distributors.', status: 'production' }
];

const seedOS = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    for (const product of defaultOSProducts) {
      const existing = await OSProduct.findOne({ slug: product.slug });
      if (!existing) {
        await OSProduct.create(product);
        console.log(`Created OS: ${product.name}`);
      } else {
        console.log(`OS already exists: ${product.name}`);
      }
    }
    
    console.log('OS Seeding Complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedOS();
