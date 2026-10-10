import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OSProduct from '../models/OSProduct.js';
import OSPlan from '../models/OSPlan.js';
import Organization from '../models/Organization.js';
import Subscription from '../models/Subscription.js';

dotenv.config();

const seed2TierPlans = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for 2-Tier OS Realignment...');

    // 1. Ensure OS Products exist with businessType
    const osProductsData = [
      {
        name: 'Apex Contractor OS',
        code: 'CONTRACTOR',
        slug: 'contractor-os',
        businessType: 'CONTRACTOR',
        description: 'Complete operating system for civil contractors and builders',
        version: '2.4.0',
        isActive: true
      },
      {
        name: 'Apex Material Supplier OS',
        code: 'MATERIAL_SUPPLIER',
        slug: 'supplier-os',
        businessType: 'MATERIAL_SUPPLIER',
        description: 'Fleet logistics, challans and inventory for construction suppliers',
        version: '2.1.0',
        isActive: true
      },
      {
        name: 'Chicken Distributor OS',
        code: 'CHICKEN_DISTRIBUTOR',
        slug: 'chicken-distributor',
        businessType: 'CHICKEN_DISTRIBUTOR',
        description: 'End-to-end supply chain OS for poultry distributors & fleet',
        version: '2.0.0',
        isActive: true
      },
      {
        name: 'Apex Diagnostics OS',
        code: 'DIAGNOSTICS',
        slug: 'diagnostics-os',
        businessType: 'DIAGNOSTICS',
        description: 'Cloud LIMS with barcode accessioning, QC and doctor commissions',
        version: '2.2.0',
        isActive: true
      }
    ];

    const osProducts = {};
    for (const prodData of osProductsData) {
      let prod = await OSProduct.findOne({ 
        $or: [{ code: prodData.code }, { slug: prodData.slug }, { businessType: prodData.businessType }] 
      });
      if (!prod) {
        prod = await OSProduct.create(prodData);
        console.log(`Created OSProduct: ${prod.name}`);
      } else {
        prod.businessType = prodData.businessType;
        prod.name = prodData.name;
        prod.code = prodData.code;
        prod.slug = prodData.slug;
        await prod.save();
        console.log(`Updated OSProduct: ${prod.name}`);
      }
      osProducts[prodData.businessType] = prod;
    }

    // 2. Remove legacy plans for these products
    const productIds = Object.values(osProducts).map(p => p._id);
    await OSPlan.deleteMany({ osProductId: { $in: productIds } });
    console.log('Removed legacy plans for core OS products.');

    // 3. Define the EXACT 2 PLANS per OS
    const plansToCreate = [
      // Contractor OS
      {
        name: 'Contractor Growth Plan',
        tier: 'STARTER',
        osProductId: osProducts.CONTRACTOR._id,
        monthlyPrice: 1499,
        yearlyPrice: 14990,
        setupFee: 0,
        description: 'Core BOQ, DPR, site attendance, and material indents for growing contractors.',
        supportLevel: 'standard',
        usageLimits: { users: 5, storageGB: 15, projects: 5, transactions: -1 },
        isActive: true
      },
      {
        name: 'Contractor Enterprise Suite',
        tier: 'ENTERPRISE',
        osProductId: osProducts.CONTRACTOR._id,
        monthlyPrice: 3499,
        yearlyPrice: 34990,
        setupFee: 0,
        description: 'Complete civil enterprise suite with Snags, Petty Cash, Machinery Telemetry, Civil P&L, and Drawing Vault.',
        supportLevel: 'dedicated',
        usageLimits: { users: -1, storageGB: 100, projects: -1, transactions: -1 },
        isActive: true
      },

      // Supplier OS
      {
        name: 'Supplier Depot Plan',
        tier: 'STARTER',
        osProductId: osProducts.MATERIAL_SUPPLIER._id,
        monthlyPrice: 1499,
        yearlyPrice: 14990,
        setupFee: 0,
        description: 'SKU catalog, orders, GST billing, and customer payments for single-depot suppliers.',
        supportLevel: 'standard',
        usageLimits: { users: 5, storageGB: 15, projects: -1, transactions: -1 },
        isActive: true
      },
      {
        name: 'Supplier Fleet & Scale Suite',
        tier: 'ENTERPRISE',
        osProductId: osProducts.MATERIAL_SUPPLIER._id,
        monthlyPrice: 3499,
        yearlyPrice: 34990,
        setupFee: 0,
        description: 'Multi-warehouse stock ledger, vehicle fleet logistics, driver dispatch, and digital e-challans.',
        supportLevel: 'dedicated',
        usageLimits: { users: -1, storageGB: 100, projects: -1, transactions: -1 },
        isActive: true
      },

      // Chicken Distributor OS
      {
        name: 'Distributor Standard Plan',
        tier: 'STARTER',
        osProductId: osProducts.CHICKEN_DISTRIBUTOR._id,
        monthlyPrice: 999,
        yearlyPrice: 9990,
        setupFee: 0,
        description: 'Daily pre-orders, bird weight estimations, customer balances, and live stock reconciliation.',
        supportLevel: 'standard',
        usageLimits: { users: 3, storageGB: 10, projects: -1, transactions: -1 },
        isActive: true
      },
      {
        name: 'Distributor Pro Fleet Suite',
        tier: 'ENTERPRISE',
        osProductId: osProducts.CHICKEN_DISTRIBUTOR._id,
        monthlyPrice: 2499,
        yearlyPrice: 24990,
        setupFee: 0,
        description: 'Fleet vehicle route history, driver mobile app, automated daily P&L margin variance, and WhatsApp statements.',
        supportLevel: 'dedicated',
        usageLimits: { users: -1, storageGB: 50, projects: -1, transactions: -1 },
        isActive: true
      },

      // Diagnostics OS
      {
        name: 'Diagnostics Clinic Plan',
        tier: 'STARTER',
        osProductId: osProducts.DIAGNOSTICS._id,
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        setupFee: 0,
        description: 'Patient registration, test directory, manual result entry, and standard billing receipts.',
        supportLevel: 'standard',
        usageLimits: { users: 5, storageGB: 20, projects: -1, transactions: -1 },
        isActive: true
      },
      {
        name: 'Diagnostics Enterprise LIMS',
        tier: 'ENTERPRISE',
        osProductId: osProducts.DIAGNOSTICS._id,
        monthlyPrice: 4499,
        yearlyPrice: 44990,
        setupFee: 0,
        description: 'Phlebotomy barcode accessioning, doctor commissions, automated WhatsApp dispatch, and Levey-Jennings QC.',
        supportLevel: 'dedicated',
        usageLimits: { users: -1, storageGB: 150, projects: -1, transactions: -1 },
        isActive: true
      }
    ];

    const createdPlans = {};
    for (const planDef of plansToCreate) {
      const plan = await OSPlan.create(planDef);
      console.log(`Created Plan: [${planDef.tier}] ${plan.name} (₹${plan.monthlyPrice}/mo)`);
      if (!createdPlans[plan.osProductId.toString()]) {
        createdPlans[plan.osProductId.toString()] = {};
      }
      createdPlans[plan.osProductId.toString()][plan.tier] = plan;
    }

    // 4. ACTIVATE ALL DEMO/EXISTING ORGANIZATIONS ON TOP PLAN (Tier 2: Enterprise / Pro)
    console.log('Activating TOP PLAN (Tier 2 Enterprise) for all active tenant organizations...');
    const orgs = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } });

    for (const org of orgs) {
      const prod = osProducts[org.businessType] || osProducts.CONTRACTOR;
      const topPlan = createdPlans[prod._id.toString()]?.ENTERPRISE;

      if (topPlan) {
        // Find existing subscription or create new
        let sub = await Subscription.findOne({ organizationId: org._id });
        if (!sub) {
          sub = await Subscription.create({
            organizationId: org._id,
            osProductId: prod._id,
            osPlanId: topPlan._id,
            billingCycle: 'yearly',
            basePrice: topPlan.yearlyPrice,
            finalAmount: topPlan.yearlyPrice,
            startDate: new Date(),
            nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            customEntitlements: {},
            customUsageLimits: {}
          });
        } else {
          sub.osProductId = prod._id;
          sub.osPlanId = topPlan._id;
          sub.status = 'ACTIVE';
          sub.billingCycle = 'yearly';
          sub.basePrice = topPlan.yearlyPrice;
          sub.finalAmount = topPlan.yearlyPrice;
          sub.nextBillingDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          await sub.save();
        }

        org.subscription = topPlan.name;
        await org.save();

        console.log(`Organization "${org.name}" (${org.businessType}) activated on TOP PLAN: ${topPlan.name}`);
      }
    }

    console.log('Master 2-Tier Realignment complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during 2-Tier Realignment:', err);
    process.exit(1);
  }
};

seed2TierPlans();
