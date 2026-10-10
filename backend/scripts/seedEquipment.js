import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Equipment from '../src/models/Equipment.js';
import EquipmentLog from '../src/models/EquipmentLog.js';
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
  await Equipment.deleteMany({ organizationId: contractor.organizationId });
  await EquipmentLog.deleteMany({ organizationId: contractor.organizationId });

  // 1. Plant Master
  const machinesData = [
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      name: 'JCB 3DX Super Backhoe Loader',
      equipmentCode: 'EQ-JCB-01',
      category: 'EARTHMOVING',
      ownership: 'RENTED',
      supplierOrOwner: 'Kailash Heavy Earthmovers',
      registrationNo: 'MH-14-EA-4821',
      modelYear: '2023',
      operatorName: 'Ramesh Yadav',
      operatorPhone: '9822144321',
      rateType: 'HOURLY',
      rentalRate: 1150, // ₹1,150 / hr
      fuelType: 'DIESEL',
      fuelTankCapacity: 130,
      standardConsumptionPerHour: 5.5,
      initialMeterReading: 1240,
      currentMeterReading: 1276.5,
      status: 'ACTIVE',
      notes: 'Hired for basement excavation and earth filling.'
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      name: 'Tata Hitachi EX200 LC Hydraulic Excavator',
      equipmentCode: 'EQ-EXC-02',
      category: 'EXCAVATION',
      ownership: 'RENTED',
      supplierOrOwner: 'National Earth Works Pvt Ltd',
      registrationNo: 'MH-12-BF-9042',
      modelYear: '2022',
      operatorName: 'Gurdeep Singh',
      operatorPhone: '9822998811',
      rateType: 'HOURLY',
      rentalRate: 2400, // ₹2,400 / hr
      fuelType: 'DIESEL',
      fuelTankCapacity: 310,
      standardConsumptionPerHour: 14.0,
      initialMeterReading: 3110,
      currentMeterReading: 3144.0,
      status: 'ACTIVE',
      notes: 'Heavy rock breaker attachment installed.'
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      name: 'Schwing Stetter 6 Cu.m Transit Mixer',
      equipmentCode: 'EQ-MIX-03',
      category: 'CONCRETING',
      ownership: 'OWNED',
      supplierOrOwner: 'Company Owned Asset',
      registrationNo: 'MH-14-DT-7711',
      modelYear: '2024',
      operatorName: 'Vinod Pawar',
      operatorPhone: '9890123456',
      rateType: 'HOURLY',
      rentalRate: 0,
      fuelType: 'DIESEL',
      fuelTankCapacity: 200,
      standardConsumptionPerHour: 4.0,
      initialMeterReading: 850,
      currentMeterReading: 882.0,
      status: 'ACTIVE',
      notes: 'Dedicated to Tower A batching plant cartage.'
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      name: 'Kirloskar 125 kVA Silent DG Set',
      equipmentCode: 'EQ-GEN-04',
      category: 'POWER_GENERATION',
      ownership: 'RENTED',
      supplierOrOwner: 'PowerLine Rentals Pune',
      registrationNo: 'GEN-KIR-125',
      modelYear: '2023',
      operatorName: 'Electrician Team',
      operatorPhone: '9876540000',
      rateType: 'DAILY',
      rentalRate: 2500, // ₹2,500 / day
      fuelType: 'DIESEL',
      fuelTankCapacity: 250,
      standardConsumptionPerHour: 18.0,
      initialMeterReading: 1540,
      currentMeterReading: 1572.0,
      status: 'ACTIVE',
      notes: 'Site tower crane & batching backup power.'
    }
  ];

  const createdMachines = await Equipment.insertMany(machinesData);
  console.log(`Seeded ${createdMachines.length} plant & machinery assets`);

  // 2. Daily Run & Fuel Logs (Last 3 days)
  const jcb = createdMachines[0];
  const excavator = createdMachines[1];
  const mixer = createdMachines[2];
  const dg = createdMachines[3];

  const logsData = [
    // JCB Log Today
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      equipmentId: jcb._id,
      logDate: new Date('2026-10-10'),
      slipNo: 'EQ-LOG-2026-10-10-01',
      shift: 'DAY',
      startMeter: 1268.0,
      endMeter: 1276.5,
      operatingHours: 8.5,
      idleHours: 1.0,
      breakdownHours: 0,
      fuelIssuedLiters: 48.0,
      fuelRatePerLiter: 92,
      fuelTotalCost: 4416,
      fuelSource: 'SITE_TANK',
      fuelSlipNumber: 'DSL-2026-401',
      equipmentRentalCost: 9775, // 8.5 * 1150
      operatorCost: 600,
      totalDayCost: 14791,
      workDescription: 'Raft foundation perimeter backfilling & trimming Grid A1-A4',
      location: 'Tower A Raft North',
      operatorName: 'Ramesh Yadav',
      supervisorName: 'Kishore Site Supv',
      status: 'VERIFIED',
      remarks: 'Clean operation. Greasing completed.',
      recordedBy: contractor._id
    },
    // Excavator Log Today
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      equipmentId: excavator._id,
      logDate: new Date('2026-10-10'),
      slipNo: 'EQ-LOG-2026-10-10-02',
      shift: 'DAY',
      startMeter: 3136.0,
      endMeter: 3144.0,
      operatingHours: 8.0,
      idleHours: 0.5,
      breakdownHours: 0,
      fuelIssuedLiters: 110.0,
      fuelRatePerLiter: 92,
      fuelTotalCost: 10120,
      fuelSource: 'SITE_TANK',
      fuelSlipNumber: 'DSL-2026-402',
      equipmentRentalCost: 19200, // 8.0 * 2400
      operatorCost: 800,
      totalDayCost: 30120,
      workDescription: 'Hard rock chiseling with hydraulic breaker in pump room pit',
      location: 'Basement-2 Sump Pit',
      operatorName: 'Gurdeep Singh',
      supervisorName: 'Kishore Site Supv',
      status: 'VERIFIED',
      remarks: 'Breaker points inspected.',
      recordedBy: contractor._id
    },
    // Transit Mixer Log Today
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      equipmentId: mixer._id,
      logDate: new Date('2026-10-10'),
      slipNo: 'EQ-LOG-2026-10-10-03',
      shift: 'DAY',
      startMeter: 875.0,
      endMeter: 882.0,
      operatingHours: 7.0,
      idleHours: 1.5,
      breakdownHours: 0,
      fuelIssuedLiters: 32.0,
      fuelRatePerLiter: 92,
      fuelTotalCost: 2944,
      fuelSource: 'LOCAL_PUMP',
      fuelSlipNumber: 'IOCL-78912',
      equipmentRentalCost: 0, // Owned
      operatorCost: 500,
      totalDayCost: 3444,
      workDescription: 'Cartage of M30 grade RMC concrete to pump hopper',
      location: 'Tower A Core Wall Pour',
      operatorName: 'Vinod Pawar',
      supervisorName: 'Kishore Site Supv',
      status: 'VERIFIED',
      remarks: 'Water wash done after pour.',
      recordedBy: contractor._id
    },
    // DG Set Log Today
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      equipmentId: dg._id,
      logDate: new Date('2026-10-10'),
      slipNo: 'EQ-LOG-2026-10-10-04',
      shift: 'DAY',
      startMeter: 1566.0,
      endMeter: 1572.0,
      operatingHours: 6.0,
      idleHours: 0,
      breakdownHours: 0,
      fuelIssuedLiters: 95.0,
      fuelRatePerLiter: 92,
      fuelTotalCost: 8740,
      fuelSource: 'SITE_TANK',
      fuelSlipNumber: 'DSL-2026-403',
      equipmentRentalCost: 2500, // Daily rate
      operatorCost: 300,
      totalDayCost: 11540,
      workDescription: 'Backup power during MSEDCL grid outage for concrete placing boom',
      location: 'Substation Yard',
      operatorName: 'Electrician Team',
      supervisorName: 'Kishore Site Supv',
      status: 'VERIFIED',
      remarks: 'Smooth operation. Voltage stable.',
      recordedBy: contractor._id
    }
  ];

  const createdLogs = await EquipmentLog.insertMany(logsData);
  console.log(`Seeded ${createdLogs.length} daily plant & diesel logs`);

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
