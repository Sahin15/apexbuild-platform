import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import PettyCashAccount from '../src/models/PettyCashAccount.js';
import PettyCashTransaction from '../src/models/PettyCashTransaction.js';
import Project from '../src/models/Project.js';
import User from '../src/models/User.js';

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const contractor = await User.findOne({ email: 'contractor@example.com' });
  if (!contractor) {
    console.error('Contractor user not found');
    process.exit(1);
  }

  const project = await Project.findOne({ 
    organizationId: contractor.organizationId,
    name: /Skyline/i 
  });

  if (!project) {
    console.error('Skyline project not found');
    process.exit(1);
  }

  // Clear existing
  await PettyCashAccount.deleteMany({ organizationId: contractor.organizationId });
  await PettyCashTransaction.deleteMany({ organizationId: contractor.organizationId });

  // 1. Create Supervisor Float Accounts
  const account1 = await PettyCashAccount.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    supervisorName: 'Kishore Site Supervisor',
    supervisorPhone: '9822011223',
    upiId: 'kishore.site@okhdfcbank',
    allocatedFloat: 25000,
    currentBalance: 14850,
    totalReceived: 35000, // Initial 25k + 10k Top-up
    totalSpent: 20150,
    status: 'ACTIVE',
    lastTopUpDate: new Date('2026-10-06'),
    notes: 'Tower A main civil structure & daily site purchases.'
  });

  const account2 = await PettyCashAccount.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    supervisorName: 'Mohan Civil Engineer',
    supervisorPhone: '9890455667',
    upiId: 'mohan.engg@oksbi',
    allocatedFloat: 20000,
    currentBalance: 7200,
    totalReceived: 20000,
    totalSpent: 12800,
    status: 'ACTIVE',
    lastTopUpDate: new Date('2026-10-01'),
    notes: 'Basement shoring, dewatering & plumbing line emergency purchases.'
  });

  console.log('Seeded 2 supervisor cash float accounts');

  // 2. Transactions (Top-ups + Vouchers)
  const transactionsData = [
    // Initial Top-ups
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'TOP_UP',
      voucherNo: 'TOP-2026-001',
      date: new Date('2026-10-01'),
      amount: 25000,
      category: 'OTHER',
      description: 'Initial Sanctioned Imprest Cash Float',
      vendorName: 'Contractor Main Treasury',
      paymentMode: 'BANK_TRANSFER',
      status: 'APPROVED',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-01')
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'TOP_UP',
      voucherNo: 'TOP-2026-002',
      date: new Date('2026-10-06'),
      amount: 10000,
      category: 'OTHER',
      description: 'Cash Float Top-up via GooglePay / UPI',
      vendorName: 'Contractor Main Treasury',
      paymentMode: 'UPI',
      status: 'APPROVED',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-06')
    },
    // Approved Vouchers
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-001',
      date: new Date('2026-10-03'),
      amount: 2800,
      category: 'SITE_HARDWARE',
      description: '25kg 18-gauge binding wire & 3" steel concrete nails for column shuttering',
      vendorName: 'Shree Balaji Hardware & Steel',
      billNumber: 'SBH-4491',
      paymentMode: 'CASH',
      status: 'APPROVED',
      submittedBy: 'Kishore Site Supervisor',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-03')
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-002',
      date: new Date('2026-10-05'),
      amount: 4600,
      category: 'DIESEL_FUEL',
      description: '50 Liters diesel in barrels for concrete vibrator engine & night floodlight DG',
      vendorName: 'HPCL Kothrud Bypass Pump',
      billNumber: 'HP-88124',
      paymentMode: 'CASH',
      status: 'APPROVED',
      submittedBy: 'Kishore Site Supervisor',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-05')
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-003',
      date: new Date('2026-10-07'),
      amount: 1500,
      category: 'LOCAL_CARTAGE',
      description: 'Tata Ace tempo cartage for moving 350 shuttering props from yard to Tower A',
      vendorName: 'Om Sai Goods Transport',
      billNumber: 'MEMO-912',
      paymentMode: 'CASH',
      status: 'APPROVED',
      submittedBy: 'Kishore Site Supervisor',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-07')
    },
    // PENDING Vouchers (Waiting for Contractor 1-Click Approval!)
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-004',
      date: new Date('2026-10-09'),
      amount: 1350,
      category: 'LABOUR_TEA_FOOD',
      description: 'Tea, biscuits & mineral water for 24 masons & helpers during 4-hour night slab pour overtime',
      vendorName: 'Mahalaxmi Site Canteen Stall',
      billNumber: 'REC-301',
      paymentMode: 'CASH',
      status: 'PENDING',
      submittedBy: 'Kishore Site Supervisor'
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account1._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-005',
      date: new Date('2026-10-10'),
      amount: 3200,
      category: 'EMERGENCY_REPAIR',
      description: 'Urgent replacement of 2.5" heavy-duty slurry suction hose & quick clamps for basement sump pump',
      vendorName: 'Perfect Rubber & Hydraulic Hoses',
      billNumber: 'PRH-1049',
      paymentMode: 'CASH',
      status: 'PENDING',
      submittedBy: 'Kishore Site Supervisor'
    },
    // Account 2 Transactions
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account2._id,
      type: 'TOP_UP',
      voucherNo: 'TOP-2026-003',
      date: new Date('2026-10-01'),
      amount: 20000,
      category: 'OTHER',
      description: 'Initial Sanctioned Imprest Cash Float',
      vendorName: 'Contractor Main Treasury',
      paymentMode: 'BANK_TRANSFER',
      status: 'APPROVED',
      approvedBy: contractor._id,
      approvalDate: new Date('2026-10-01')
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      accountId: account2._id,
      type: 'EXPENSE',
      voucherNo: 'VCH-2026-006',
      date: new Date('2026-10-08'),
      amount: 2450,
      category: 'SAFETY_PPE',
      description: '15 safety helmets, 6 reflective high-vis jackets & 2 caution ribbons for new gang workers',
      vendorName: 'Suraksha Safety Equipments Pune',
      billNumber: 'SUR-7811',
      paymentMode: 'CASH',
      status: 'PENDING',
      submittedBy: 'Mohan Civil Engineer'
    }
  ];

  const createdTx = await PettyCashTransaction.insertMany(transactionsData);
  console.log(`Seeded ${createdTx.length} petty cash transactions`);

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
