import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Organization from './models/Organization.js';
import OSProduct from './models/OSProduct.js';
import OSPlan from './models/OSPlan.js';
import Subscription from './models/Subscription.js';
import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const seedMaster = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Master Seeding...');

    // Clear old mock data (keep Superadmin intact)
    console.log('Clearing old mock data...');
    const nonSuperAdminOrgs = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } }).select('_id');
    const orgIds = nonSuperAdminOrgs.map(o => o._id);

    await Organization.deleteMany({ businessType: { $ne: 'SUPERADMIN' } });
    await User.deleteMany({ organizationId: { $in: orgIds } });
    await Subscription.deleteMany();
    await Invoice.deleteMany();
    await Payment.deleteMany();
    await OSProduct.deleteMany();
    await OSPlan.deleteMany();

    // 1. Create OS Products
    console.log('Seeding OS Products & Plans...');
    const prodChicken = await OSProduct.create({
      name: 'Chicken Distributor OS',
      code: 'CHK_DIST',
      slug: 'chicken-distributor',
      description: 'End-to-end supply chain OS for poultry distributors',
      version: '1.2.0',
      isActive: true,
      features: ['Live Inventory', 'Route Optimization', 'B2B Portal']
    });

    const prodRetail = await OSProduct.create({
      name: 'Retail POS System',
      code: 'RETAIL_POS',
      slug: 'retail-pos',
      description: 'Unified retail management and POS',
      version: '2.0.1',
      isActive: true,
      features: ['Omnichannel POS', 'Inventory', 'CRM']
    });

    // 2. Create OS Plans
    const planChickenBasic = await OSPlan.create({
      name: 'Standard',
      osProductId: prodChicken._id,
      type: 'base',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      features: ['Basic Routing', 'Up to 5 Users'],
      isActive: true
    });

    const planRetailPro = await OSPlan.create({
      name: 'Pro',
      osProductId: prodRetail._id,
      type: 'base',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      features: ['Unlimited Users', 'Advanced CRM', 'Priority Support'],
      isActive: true
    });

    // 3. Create Organizations (Business Partners)
    console.log('Seeding Business Organizations, Users, and Subscriptions...');
    const businesses = [
      { name: 'Fresh Farms Poultry', type: 'CHICKEN_DISTRIBUTOR', prod: prodChicken, plan: planChickenBasic, status: 'active' },
      { name: 'National Chicken Co.', type: 'CHICKEN_DISTRIBUTOR', prod: prodChicken, plan: planChickenBasic, status: 'active' },
      { name: 'Sunrise Restaurant', type: 'RESTAURANT', prod: prodRetail, plan: planRetailPro, status: 'active' },
      { name: 'Downtown Pharmacy', type: 'PHARMACY', prod: prodRetail, plan: planRetailPro, status: 'suspended' }, // Churned
      { name: 'MegaMart Education', type: 'EDUCATION', prod: prodRetail, plan: planRetailPro, status: 'active' }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      
      const org = await Organization.create({
        name: b.name,
        email: `contact@${b.name.replace(/\s+/g, '').toLowerCase()}.com`,
        phone: `+1800555000${i}`,
        businessType: b.type,
        status: b.status,
        address: '123 Business Rd, City, State'
      });

      // User
      const user = await User.create({
        organizationId: org._id,
        name: `${b.name} Admin`,
        email: `admin@${b.name.replace(/\s+/g, '').toLowerCase()}.com`,
        passwordHash,
        role: 'OWNER',
        status: 'active'
      });

      // Extra simulated users for telemetry volume
      for(let j=0; j<10; j++) {
        await User.create({
          organizationId: org._id,
          name: `Staff ${j}`,
          email: `staff${j}@${b.name.replace(/\s+/g, '').toLowerCase()}.com`,
          passwordHash,
          role: 'MANAGER',
          status: 'active'
        });
      }

      // Subscription
      const subStatus = b.status === 'active' ? 'ACTIVE' : 'CANCELLED';
      const subscription = await Subscription.create({
        organizationId: org._id,
        osProductId: b.prod._id,
        osPlanId: b.plan._id,
        status: subStatus,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        billingCycle: 'monthly',
        basePrice: b.plan.monthlyPrice,
        finalAmount: b.plan.monthlyPrice,
        discountApplied: 0
      });

      // 4. Invoices & Payments
      const invoice = await Invoice.create({
        organizationId: org._id,
        osProductId: b.prod._id,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${i}`,
        type: 'SUBSCRIPTION',
        status: b.status === 'active' ? 'PAID' : 'OVERDUE',
        total: b.plan.monthlyPrice,
        dueAmount: b.status === 'active' ? 0 : b.plan.monthlyPrice,
        dueDate: new Date(),
        subscriptionFee: b.plan.monthlyPrice,
        tax: 0
      });

      if (b.status === 'active') {
        await Payment.create({
          invoiceId: invoice._id,
          organizationId: org._id,
          amount: b.plan.monthlyPrice,
          status: 'VERIFIED',
          paymentMethod: 'BANK_TRANSFER',
          transactionReference: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
      }

      // Implementation Fee Invoice (Historical)
      const implInvoice = await Invoice.create({
        organizationId: org._id,
        osProductId: b.prod._id,
        invoiceNumber: `IMP-${Date.now().toString().slice(-6)}-${i}`,
        type: 'IMPLEMENTATION',
        status: 'PAID',
        total: 1500,
        dueAmount: 0,
        dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        implementationFee: 1500,
        tax: 0
      });

      await Payment.create({
        invoiceId: implInvoice._id,
        organizationId: org._id,
        amount: 1500,
        status: 'VERIFIED',
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: `TXN-IMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
    }

    console.log('Seeding Master Data Complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding master data:', error);
    process.exit(1);
  }
};

seedMaster();
