import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import OSProduct from '../src/models/OSProduct.js';
import OSPlan from '../src/models/OSPlan.js';
import Subscription from '../src/models/Subscription.js';
import Invoice from '../src/models/Invoice.js';

// Contractor Models
import Project from '../src/models/Project.js';
import Client from '../src/models/Client.js';
import BOQ from '../src/models/BOQ.js';
import BOQItem from '../src/models/BOQItem.js';
import SiteReport from '../src/models/SiteReport.js';
import Snag from '../src/models/Snag.js';
import PettyCashAccount from '../src/models/PettyCashAccount.js';

// Supplier Models
import SupplierProduct from '../src/models/SupplierProduct.js';
import SupplierCustomer from '../src/models/SupplierCustomer.js';
import SupplierVendor from '../src/models/SupplierVendor.js';
import SupplierOrder from '../src/models/SupplierOrder.js';
import SupplierVehicle from '../src/models/SupplierVehicle.js';
import SupplierDriver from '../src/models/SupplierDriver.js';

// Diagnostics Models
import Patient from '../src/models/Patient.js';
import Test from '../src/models/Test.js';
import Doctor from '../src/models/Doctor.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';

async function seedMultiTenancy() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Multi-Tenant Seeding...');

    // 1. Ensure OS Products & Plans exist
    let contractorProd = await OSProduct.findOne({ $or: [{ slug: 'contractor-os' }, { businessType: 'CONTRACTOR' }] });
    if (!contractorProd) {
      contractorProd = await OSProduct.create({
        name: 'Apex Contractor OS',
        slug: 'contractor-os',
        businessType: 'CONTRACTOR',
        description: 'Comprehensive ERP for General & Civil Infrastructure Contractors',
        status: 'production'
      });
    }

    let supplierProd = await OSProduct.findOne({ $or: [{ slug: 'supplier-os' }, { businessType: 'MATERIAL_SUPPLIER' }] });
    if (!supplierProd) {
      supplierProd = await OSProduct.create({
        name: 'Apex Material Supplier OS',
        slug: 'supplier-os',
        businessType: 'MATERIAL_SUPPLIER',
        description: 'Inventory, fleet logistics, delivery dispatch and receivables for building material suppliers',
        status: 'production'
      });
    }

    let diagProd = await OSProduct.findOne({ $or: [{ slug: 'diagnostics-os' }, { businessType: 'DIAGNOSTICS' }] });
    if (!diagProd) {
      diagProd = await OSProduct.create({
        name: 'Apex Diagnostics OS',
        slug: 'diagnostics-os',
        businessType: 'DIAGNOSTICS',
        description: 'LIMS, specimen tracking, report dispatch & doctor referral management',
        status: 'production'
      });
    }

    // Plans
    let contractorPlanEnt = await OSPlan.findOne({ osProductId: contractorProd._id, name: /Enterprise/i });
    if (!contractorPlanEnt) {
      contractorPlanEnt = await OSPlan.create({
        osProductId: contractorProd._id,
        name: 'Enterprise Infrastructure Suite',
        monthlyPrice: 45000,
        yearlyPrice: 480000,
        setupFee: 25000,
        description: 'Unlimited Projects, Civil P&L Analysis, Petty Cash Ledger, Site Snag Vault',
        isActive: true
      });
    }

    let contractorPlanPro = await OSPlan.findOne({ osProductId: contractorProd._id, name: /Pro/i });
    if (!contractorPlanPro) {
      contractorPlanPro = await OSPlan.create({
        osProductId: contractorProd._id,
        name: 'Pro Contractor Suite',
        monthlyPrice: 28000,
        yearlyPrice: 300000,
        setupFee: 15000,
        description: 'Up to 10 Projects, BOQ Automation, Daily Labor Wage',
        isActive: true
      });
    }

    let supplierPlanGrowth = await OSPlan.findOne({ osProductId: supplierProd._id, name: /Growth/i });
    if (!supplierPlanGrowth) {
      supplierPlanGrowth = await OSPlan.create({
        osProductId: supplierProd._id,
        name: 'Supplier Growth Fleet Plan',
        monthlyPrice: 32000,
        yearlyPrice: 340000,
        setupFee: 20000,
        description: 'Fleet Dispatch, Inventory Ledger, Challan Invoicing',
        isActive: true
      });
    }

    let supplierPlanScale = await OSPlan.findOne({ osProductId: supplierProd._id, name: /Scale/i });
    if (!supplierPlanScale) {
      supplierPlanScale = await OSPlan.create({
        osProductId: supplierProd._id,
        name: 'Supplier Depot Scale Plan',
        monthlyPrice: 24000,
        yearlyPrice: 260000,
        setupFee: 10000,
        description: 'Depot Stock Control, Vehicle Trip Tracking, Direct Customer Ledger',
        isActive: true
      });
    }

    let diagPlanEnt = await OSPlan.findOne({ osProductId: diagProd._id, name: /Enterprise/i });
    if (!diagPlanEnt) {
      diagPlanEnt = await OSPlan.create({
        osProductId: diagProd._id,
        name: 'Diagnostics Enterprise LIMS',
        monthlyPrice: 38000,
        yearlyPrice: 400000,
        setupFee: 30000,
        description: 'Multi-Branch Lab, Doctor Referral Commissions, Automated Pathology Dispatch',
        isActive: true
      });
    }

    let diagPlanPro = await OSPlan.findOne({ osProductId: diagProd._id, name: /Pro/i });
    if (!diagPlanPro) {
      diagPlanPro = await OSPlan.create({
        osProductId: diagProd._id,
        name: 'Diagnostics Scan & Lab Pro',
        monthlyPrice: 26000,
        yearlyPrice: 280000,
        setupFee: 15000,
        description: 'Imaging & Pathology Workflows, Patient Portal, Daily Cashier Shifts',
        isActive: true
      });
    }

    // Helper to setup or clean an org
    async function setupOrg(data, userData, plan, customPricing) {
      let org = await Organization.findOne({ email: data.email });
      if (org) {
        // Clean related isolated data
        await User.deleteMany({ organizationId: org._id });
        await Subscription.deleteMany({ organizationId: org._id });
        await Invoice.deleteMany({ organizationId: org._id });
        await Project.deleteMany({ organizationId: org._id });
        await Client.deleteMany({ organizationId: org._id });
        await BOQ.deleteMany({ organizationId: org._id });
        await BOQItem.deleteMany({ organizationId: org._id });
        await SiteReport.deleteMany({ organizationId: org._id });
        await Snag.deleteMany({ organizationId: org._id });
        await PettyCashAccount.deleteMany({ organizationId: org._id });
        await SupplierProduct.deleteMany({ organizationId: org._id });
        await SupplierCustomer.deleteMany({ organizationId: org._id });
        await SupplierVendor.deleteMany({ organizationId: org._id });
        await SupplierOrder.deleteMany({ organizationId: org._id });
        await SupplierVehicle.deleteMany({ organizationId: org._id });
        await SupplierDriver.deleteMany({ organizationId: org._id });
        await Patient.deleteMany({ organizationId: org._id });
        await Test.deleteMany({ organizationId: org._id });
        await Doctor.deleteMany({ organizationId: org._id });
        await Organization.deleteOne({ _id: org._id });
      }

      org = await Organization.create({
        ...data,
        status: 'active'
      });

      const user = await User.create({
        organizationId: org._id,
        name: userData.name,
        email: userData.email,
        passwordHash: '123456', // Pre-save hook hashes this
        role: 'ADMIN',
        status: 'active'
      });

      const basePrice = plan.monthlyPrice;
      const customPrice = customPricing.customPrice || basePrice;
      const discount = customPricing.discount || 0;
      const finalAmount = Math.max(0, customPrice - discount);

      // Subscription
      const sub = await Subscription.create({
        organizationId: org._id,
        osProductId: plan.osProductId,
        osPlanId: plan._id,
        status: 'ACTIVE',
        billingCycle: customPricing.billingCycle || 'monthly',
        basePrice,
        customPrice,
        discount,
        finalAmount,
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      return { org, user, sub };
    }

    console.log('\n--- Seeding Contractor OS: Business 1 (Apex Infrastructure Ltd) ---');
    const { org: contractorOrgA, user: userContractorA } = await setupOrg(
      {
        name: 'Apex Infrastructure Ltd',
        legalName: 'Apex Infrastructure & Heavy Civil Works Ltd',
        email: 'apex.infra@example.com',
        phone: '+91 98201 11223',
        businessType: 'CONTRACTOR',
        city: 'Mumbai',
        state: 'Maharashtra',
        gstNumber: '27AAACA1234F1Z5'
      },
      { name: 'Vikram Singhania (Apex Infra MD)', email: 'apex.infra@example.com' },
      contractorPlanEnt,
      { customPrice: 45000, discount: 4500, setupFee: 25000 }
    );

    const clientA1 = await Client.create({
      organizationId: contractorOrgA._id,
      name: 'Mumbai Metro Rail Corporation (MMRC)',
      email: 'projects@mmrc.gov.in',
      phone: '+91 22 2456 7890',
      address: 'Bandra-Kurla Complex, Mumbai'
    });

    const projectA1 = await Project.create({
      organizationId: contractorOrgA._id,
      clientId: clientA1._id,
      projectCode: 'PRJ-METRO-03',
      name: 'Metro Elevated Corridor Line 3 (Viaduct & 6 Stations)',
      contractValue: 1250000000,
      estimatedCost: 1050000000,
      status: 'ACTIVE',
      location: 'Western Express Highway, Andheri to Dahisar',
      startDate: new Date('2025-01-10'),
      expectedEndDate: new Date('2027-06-30')
    });

    const projectA2 = await Project.create({
      organizationId: contractorOrgA._id,
      clientId: clientA1._id,
      projectCode: 'PRJ-AIRPORT-T2',
      name: 'Navi Mumbai International Airport - Terminal 2 Apron Works',
      contractValue: 4500000000,
      estimatedCost: 3800000000,
      status: 'ACTIVE',
      location: 'Ulwe, Navi Mumbai',
      startDate: new Date('2025-03-01'),
      expectedEndDate: new Date('2028-03-31')
    });

    const projectA3 = await Project.create({
      organizationId: contractorOrgA._id,
      clientId: clientA1._id,
      projectCode: 'PRJ-WATER-PIPE',
      name: 'Bhandup Bulk Water Transmission Pipeline Grid',
      contractValue: 820000000,
      estimatedCost: 710000000,
      status: 'ACTIVE',
      location: 'Bhandup Water Works, Mumbai',
      startDate: new Date('2025-05-15'),
      expectedEndDate: new Date('2026-11-30')
    });

    await Snag.create({
      organizationId: contractorOrgA._id,
      projectId: projectA1._id,
      snagNumber: 'SNG-METRO-001',
      title: 'Pier Cap 42 Honeycombing in RCC',
      description: 'Minor honeycombing detected during de-shuttering at Pier 42. Requires epoxy grouting.',
      category: 'CONCRETE',
      severity: 'MAJOR',
      location: 'Pier 42 North Flange',
      status: 'OPEN'
    });

    await PettyCashAccount.create({
      organizationId: contractorOrgA._id,
      projectId: projectA1._id,
      supervisorName: 'Kishore Patil (Site Engineer)',
      allocatedFloat: 150000,
      currentBalance: 125000,
      status: 'ACTIVE'
    });

    console.log(`Seeded Contractor A (${contractorOrgA.name}): 3 Projects, 1 Snag, 1 Petty Cash Account.`);

    console.log('\n--- Seeding Contractor OS: Business 2 (BlueStone Heights Pvt Ltd) ---');
    const { org: contractorOrgB, user: userContractorB } = await setupOrg(
      {
        name: 'BlueStone Heights Pvt Ltd',
        legalName: 'BlueStone Heights Commercial & Residential Infra Pvt Ltd',
        email: 'bluestone@example.com',
        phone: '+91 98450 33445',
        businessType: 'CONTRACTOR',
        city: 'Bengaluru',
        state: 'Karnataka',
        gstNumber: '29AABCB5566G1Z2'
      },
      { name: 'Kavita Reddy (BlueStone CEO)', email: 'bluestone@example.com' },
      contractorPlanPro,
      { customPrice: 28000, discount: 0, setupFee: 15000 }
    );

    const clientB1 = await Client.create({
      organizationId: contractorOrgB._id,
      name: 'Prestige Global Developers',
      email: 'contracts@prestigeglobal.in',
      phone: '+91 80 4112 9900',
      address: 'MG Road, Bengaluru'
    });

    const projectB1 = await Project.create({
      organizationId: contractorOrgB._id,
      clientId: clientB1._id,
      projectCode: 'PRJ-BLUE-TOW-A',
      name: 'BlueStone Grandeur Tower A (36-Story Residential)',
      contractValue: 1800000000,
      estimatedCost: 1550000000,
      status: 'ACTIVE',
      location: 'Outer Ring Road, Bellandur, Bengaluru',
      startDate: new Date('2025-02-01'),
      expectedEndDate: new Date('2027-12-31')
    });

    const projectB2 = await Project.create({
      organizationId: contractorOrgB._id,
      clientId: clientB1._id,
      projectCode: 'PRJ-HORIZON-VIL',
      name: 'Horizon Luxury Smart Villas (48 Gated Units)',
      contractValue: 950000000,
      estimatedCost: 810000000,
      status: 'ACTIVE',
      location: 'Whitefield Extended, Bengaluru',
      startDate: new Date('2025-04-10'),
      expectedEndDate: new Date('2026-10-31')
    });

    await Snag.create({
      organizationId: contractorOrgB._id,
      projectId: projectB1._id,
      snagNumber: 'SNG-BLUE-001',
      title: 'Floor 14 Balcony Railing Level Discrepancy',
      description: 'Railing alignment is off by 12mm on South balcony.',
      category: 'REBAR_FORMWORK',
      severity: 'MINOR',
      location: 'Tower A - 14th Floor South',
      status: 'OPEN'
    });

    await PettyCashAccount.create({
      organizationId: contractorOrgB._id,
      projectId: projectB1._id,
      supervisorName: 'Manoj Kumar (Site Supervisor)',
      allocatedFloat: 85000,
      currentBalance: 72000,
      status: 'ACTIVE'
    });

    console.log(`Seeded Contractor B (${contractorOrgB.name}): 2 Projects, 1 Snag, 1 Petty Cash Account.`);

    console.log('\n--- Seeding Material Supplier OS: Business 1 (Shree Ganesh Steel & Cement) ---');
    const { org: supplierOrgA, user: userSupplierA } = await setupOrg(
      {
        name: 'Shree Ganesh Steel & Cement',
        legalName: 'Shree Ganesh Building Materials Trading Corp',
        email: 'ganesh.steel@example.com',
        phone: '+91 98220 55667',
        businessType: 'MATERIAL_SUPPLIER',
        city: 'Pune',
        state: 'Maharashtra',
        gstNumber: '27AACCS9988H1Z8'
      },
      { name: 'Ganesh Agrawal (Managing Partner)', email: 'ganesh.steel@example.com' },
      supplierPlanGrowth,
      { customPrice: 32000, discount: 5000, setupFee: 20000 }
    );

    const prodA1 = await SupplierProduct.create({
      organizationId: supplierOrgA._id,
      name: 'TMT Rebar Fe550D 12mm (Tata Tiscon)',
      sku: 'TMT-12MM-TATA',
      category: 'Steel',
      unit: 'Ton',
      sellingPrice: 62000,
      purchasePrice: 58000,
      currentStock: 140,
      minStockLevel: 20
    });

    const prodA2 = await SupplierProduct.create({
      organizationId: supplierOrgA._id,
      name: 'TMT Rebar Fe550D 16mm (Jindal Panther)',
      sku: 'TMT-16MM-JINDAL',
      category: 'Steel',
      unit: 'Ton',
      sellingPrice: 61500,
      purchasePrice: 57500,
      currentStock: 95,
      minStockLevel: 15
    });

    const prodA3 = await SupplierProduct.create({
      organizationId: supplierOrgA._id,
      name: 'UltraTech OPC 53 Grade Cement',
      sku: 'CEM-ULTRA-53',
      category: 'Cement',
      unit: 'Bag',
      sellingPrice: 380,
      purchasePrice: 345,
      currentStock: 2500,
      minStockLevel: 300
    });

    const prodA4 = await SupplierProduct.create({
      organizationId: supplierOrgA._id,
      name: 'Binding Wire 18 Gauge GI',
      sku: 'WIRE-GI-18G',
      category: 'Hardware',
      unit: 'Kg',
      sellingPrice: 75,
      purchasePrice: 62,
      currentStock: 800,
      minStockLevel: 100
    });

    const vehicleA1 = await SupplierVehicle.create({
      organizationId: supplierOrgA._id,
      vehicleNumber: 'MH-12-GZ-4412',
      transportCompany: 'Ganesh Logistics Fleet',
      capacity: '16 Ton',
      status: 'ACTIVE'
    });

    const custA1 = await SupplierCustomer.create({
      organizationId: supplierOrgA._id,
      name: 'Apex Infrastructure Ltd (Client Account)',
      contactPerson: 'Vikram Singhania',
      phone: '+91 98201 11223',
      email: 'procurement@apexinfra.com',
      address: 'Andheri Metro Yard, Mumbai',
      creditLimit: 5000000
    });

    const orderA1 = await SupplierOrder.create({
      organizationId: supplierOrgA._id,
      customer: custA1._id,
      orderNumber: 'SO-GS-1001',
      orderDate: new Date(),
      items: [
        { product: prodA1._id, quantity: 20, rate: 62000, total: 1240000 },
        { product: prodA3._id, quantity: 500, rate: 380, total: 190000 }
      ],
      subTotal: 1430000,
      grandTotal: 1430000,
      dueAmount: 1430000,
      status: 'DELIVERED',
      paymentStatus: 'UNPAID',
      deliveryAddress: 'Metro Elevated Corridor Pier 45 Site Yard'
    });

    console.log(`Seeded Supplier A (${supplierOrgA.name}): 4 Products, 1 Vehicle, 1 Customer, 1 Order.`);

    console.log('\n--- Seeding Material Supplier OS: Business 2 (Apex ReadyMix Depot) ---');
    const { org: supplierOrgB, user: userSupplierB } = await setupOrg(
      {
        name: 'Apex ReadyMix Depot',
        legalName: 'Apex ReadyMix Concrete & Aggregates Pvt Ltd',
        email: 'readymix@example.com',
        phone: '+91 98210 77889',
        businessType: 'MATERIAL_SUPPLIER',
        city: 'Thane',
        state: 'Maharashtra',
        gstNumber: '27AADCA4433K1Z4'
      },
      { name: 'Rajeshwar Patil (Operations Head)', email: 'readymix@example.com' },
      supplierPlanScale,
      { customPrice: 24000, discount: 1200, setupFee: 10000 }
    );

    const prodB1 = await SupplierProduct.create({
      organizationId: supplierOrgB._id,
      name: 'M25 Ready Mix Concrete (Pumpable)',
      sku: 'RMC-M25-PUMP',
      category: 'RMC',
      unit: 'Other',
      sellingPrice: 4200,
      purchasePrice: 3600,
      currentStock: 450,
      minStockLevel: 50
    });

    const prodB2 = await SupplierProduct.create({
      organizationId: supplierOrgB._id,
      name: 'M30 High-Strength Self-Compacting RMC',
      sku: 'RMC-M30-SCC',
      category: 'RMC',
      unit: 'Other',
      sellingPrice: 4650,
      purchasePrice: 3950,
      currentStock: 320,
      minStockLevel: 40
    });

    const prodB3 = await SupplierProduct.create({
      organizationId: supplierOrgB._id,
      name: 'River Sand Washed (Zone II)',
      sku: 'SAND-WASH-Z2',
      category: 'Sand',
      unit: 'Ton',
      sellingPrice: 2100,
      purchasePrice: 1750,
      currentStock: 600,
      minStockLevel: 100
    });

    const prodB4 = await SupplierProduct.create({
      organizationId: supplierOrgB._id,
      name: '10mm Crushed Basalt Aggregate',
      sku: 'AGG-10MM-BASALT',
      category: 'Aggregates',
      unit: 'Ton',
      sellingPrice: 1450,
      purchasePrice: 1150,
      currentStock: 850,
      minStockLevel: 150
    });

    const vehicleB1 = await SupplierVehicle.create({
      organizationId: supplierOrgB._id,
      vehicleNumber: 'MH-04-RM-9090',
      transportCompany: 'Apex Transit Concrete Logistics',
      capacity: '6 m³ Drum',
      status: 'ACTIVE'
    });

    const custB1 = await SupplierCustomer.create({
      organizationId: supplierOrgB._id,
      name: 'BlueStone Heights Pvt Ltd (Client Account)',
      contactPerson: 'Kavita Reddy',
      phone: '+91 98450 33445',
      email: 'procurement@bluestone.in',
      address: 'Outer Ring Road, Bellandur, Bengaluru',
      creditLimit: 3000000
    });

    const orderB1 = await SupplierOrder.create({
      organizationId: supplierOrgB._id,
      customer: custB1._id,
      orderNumber: 'SO-RM-2001',
      orderDate: new Date(),
      items: [
        { product: prodB1._id, quantity: 60, rate: 4200, total: 252000 },
        { product: prodB2._id, quantity: 40, rate: 4650, total: 186000 }
      ],
      subTotal: 438000,
      grandTotal: 438000,
      dueAmount: 438000,
      status: 'DELIVERED',
      paymentStatus: 'UNPAID',
      deliveryAddress: 'BlueStone Grandeur Tower A - Raft Foundation Pour'
    });

    console.log(`Seeded Supplier B (${supplierOrgB.name}): 4 Products, 1 Vehicle, 1 Customer, 1 Order.`);

    console.log('\n--- Seeding Diagnostics OS: Business 1 (Apex City Pathology Labs) ---');
    const { org: diagOrgA, user: userDiagA } = await setupOrg(
      {
        name: 'Apex City Pathology Labs',
        legalName: 'Apex City Clinical Laboratories & Diagnostic Centre',
        email: 'apex.pathology@example.com',
        phone: '+91 98202 88990',
        businessType: 'DIAGNOSTICS',
        city: 'Kolkata',
        state: 'West Bengal',
        gstNumber: '19AABCA7766M1Z1'
      },
      { name: 'Dr. Ananya Sen (MD Pathologist)', email: 'apex.pathology@example.com' },
      diagPlanEnt,
      { customPrice: 38000, discount: 4500, setupFee: 30000 }
    );

    const docA1 = await Doctor.create({
      organizationId: diagOrgA._id,
      name: 'Dr. S. K. Mukherjee, MD',
      specialization: 'Internal Medicine',
      phone: '+91 98301 22334',
      email: 'sk.mukherjee@medcare.org',
      clinicAddress: 'Apex Health Clinic, Suite 4B',
      commissionRate: 15
    });

    const testA1 = await Test.create({
      organizationId: diagOrgA._id,
      testId: 'TST-CBC-01',
      name: 'Complete Blood Count (CBC with ESR)',
      category: 'Hematology',
      department: 'Pathology',
      price: 450,
      turnaroundTime: '4 Hours',
      sampleType: 'Whole Blood EDTA'
    });

    const testA2 = await Test.create({
      organizationId: diagOrgA._id,
      testId: 'TST-LIPID-02',
      name: 'Lipid Profile Comprehensive',
      category: 'Biochemistry',
      department: 'Pathology',
      price: 850,
      turnaroundTime: '6 Hours',
      sampleType: 'Serum'
    });

    const testA3 = await Test.create({
      organizationId: diagOrgA._id,
      testId: 'TST-LFT-03',
      name: 'Liver Function Test (LFT 11 Parameters)',
      category: 'Biochemistry',
      department: 'Pathology',
      price: 950,
      turnaroundTime: '6 Hours',
      sampleType: 'Serum'
    });

    const patientA1 = await Patient.create({
      organizationId: diagOrgA._id,
      patientId: 'PID-2026-0001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      age: 42,
      gender: 'Male',
      phone: '+91 98311 00112',
      email: 'rahul.sharma@example.com',
      referringDoctor: docA1._id
    });

    const patientA2 = await Patient.create({
      organizationId: diagOrgA._id,
      patientId: 'PID-2026-0002',
      firstName: 'Pooja',
      lastName: 'Mehta',
      age: 31,
      gender: 'Female',
      phone: '+91 98312 33445',
      email: 'pooja.mehta@example.com',
      referringDoctor: docA1._id
    });

    const patientA3 = await Patient.create({
      organizationId: diagOrgA._id,
      patientId: 'PID-2026-0003',
      firstName: 'Anil',
      lastName: 'Kapoor',
      age: 58,
      gender: 'Male',
      phone: '+91 98314 66778',
      email: 'anil.k@example.com',
      referringDoctor: docA1._id
    });

    console.log(`Seeded Diagnostics A (${diagOrgA.name}): 3 Tests, 3 Patients, 1 Doctor.`);

    console.log('\n--- Seeding Diagnostics OS: Business 2 (Metro Scan Diagnostics) ---');
    const { org: diagOrgB, user: userDiagB } = await setupOrg(
      {
        name: 'Metro Scan Diagnostics',
        legalName: 'Metro Advanced Imaging & Radiology Institute Pvt Ltd',
        email: 'metroscan@example.com',
        phone: '+91 98204 99001',
        businessType: 'DIAGNOSTICS',
        city: 'Hyderabad',
        state: 'Telangana',
        gstNumber: '36AABCD3322P1Z0'
      },
      { name: 'Dr. Farhan Qureshi (Chief Radiologist)', email: 'metroscan@example.com' },
      diagPlanPro,
      { customPrice: 26000, discount: 0, setupFee: 15000 }
    );

    const docB1 = await Doctor.create({
      organizationId: diagOrgB._id,
      name: 'Dr. G. Venkat Rao, MS Ortho',
      specialization: 'Orthopedics & Spine Surgery',
      phone: '+91 98490 88776',
      email: 'venkat.rao@spinehyderabad.com',
      clinicAddress: 'Banjara Hills Care Clinic',
      commissionRate: 12
    });

    const testB1 = await Test.create({
      organizationId: diagOrgB._id,
      testId: 'TST-MRI-01',
      name: 'MRI Brain & Cervical Spine with Contrast',
      category: 'Radiology',
      department: 'Radiology',
      price: 7500,
      turnaroundTime: '12 Hours',
      sampleType: 'Radiological Imaging'
    });

    const testB2 = await Test.create({
      organizationId: diagOrgB._id,
      testId: 'TST-CT-02',
      name: '128-Slice Whole Abdomen & Pelvis CT Scan',
      category: 'Radiology',
      department: 'Radiology',
      price: 5200,
      turnaroundTime: '8 Hours',
      sampleType: 'Radiological Imaging'
    });

    const testB3 = await Test.create({
      organizationId: diagOrgB._id,
      testId: 'TST-HRCT-03',
      name: 'High-Resolution Chest CT (HRCT Thorax)',
      category: 'Radiology',
      department: 'Radiology',
      price: 4200,
      turnaroundTime: '6 Hours',
      sampleType: 'Radiological Imaging'
    });

    const patientB1 = await Patient.create({
      organizationId: diagOrgB._id,
      patientId: 'PID-2026-0001',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      age: 52,
      gender: 'Male',
      phone: '+91 98491 12345',
      email: 'vikram.m@example.com',
      referringDoctor: docB1._id
    });

    const patientB2 = await Patient.create({
      organizationId: diagOrgB._id,
      patientId: 'PID-2026-0002',
      firstName: 'Sunita',
      lastName: 'Deshmukh',
      age: 47,
      gender: 'Female',
      phone: '+91 98492 56789',
      email: 'sunita.d@example.com',
      referringDoctor: docB1._id
    });

    console.log(`Seeded Diagnostics B (${diagOrgB.name}): 3 Tests, 2 Patients, 1 Doctor.`);

    console.log('\n======================================================');
    console.log('✅ MULTI-TENANT ISOLATION SEEDING COMPLETED!');
    console.log('======================================================');
    console.log('Contractor OS:');
    console.log('  1. Apex Infrastructure Ltd: apex.infra@example.com / 123456 (3 Projects)');
    console.log('  2. BlueStone Heights Pvt Ltd: bluestone@example.com / 123456 (2 Projects)');
    console.log('Material Supplier OS:');
    console.log('  1. Shree Ganesh Steel & Cement: ganesh.steel@example.com / 123456 (4 Products, 1 Order)');
    console.log('  2. Apex ReadyMix Depot: readymix@example.com / 123456 (4 Products, 1 Order)');
    console.log('Diagnostics OS:');
    console.log('  1. Apex City Pathology Labs: apex.pathology@example.com / 123456 (3 Tests, 3 Patients)');
    console.log('  2. Metro Scan Diagnostics: metroscan@example.com / 123456 (3 Tests, 2 Patients)');
    console.log('Superadmin Console:');
    console.log('  superadmin@example.com / 123456');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during multi-tenant seeding:', error);
    process.exit(1);
  }
}

seedMultiTenancy();
