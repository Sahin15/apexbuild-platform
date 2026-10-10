import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Snag from '../src/models/Snag.js';
import Project from '../src/models/Project.js';
import User from '../src/models/User.js';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
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

  // Clear existing snags
  await Snag.deleteMany({ organizationId: contractor.organizationId });

  const snagsData = [
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      snagNumber: 'SNG-2026-001',
      title: 'Structural Honeycombing on Column C3 after formwork stripping',
      description: 'Coarse aggregate exposed with voids near beam-column junction due to congested rebar and improper mechanical vibrator needle compaction. Must be chipped, cleaned, and pressure grouted with non-shrink micro-concrete before slab casting.',
      category: 'CONCRETE',
      severity: 'CRITICAL',
      location: 'Tower A - 3rd Floor Grid C2-C4',
      tradeOrGang: 'Precision Formworks',
      assignedTo: 'Jagdish Carpenter (Formwork Thekedaar)',
      identifiedDate: new Date('2026-10-08'),
      dueDate: new Date('2026-10-12'),
      status: 'OPEN',
      rectificationNotes: '',
      costImpact: 4500,
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=600&q=80',
          caption: 'Severe honeycombing at column base',
          type: 'BEFORE',
          uploadedAt: new Date('2026-10-08')
        }
      ],
      identifiedBy: contractor._id
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      snagNumber: 'SNG-2026-002',
      title: 'Inadequate concrete cover & protruding binding wire on cantilever balcony slab',
      description: 'Clear cover found to be only 12mm against required 25mm as per IS 456. PVC cover blocks missing at several bottom reinforcement bars. Cover blocks must be tied before concrete inspection.',
      category: 'REBAR_FORMWORK',
      severity: 'MAJOR',
      location: 'Tower A - 2nd Floor Balcony Flat 201',
      tradeOrGang: 'Apex Rebar Crew',
      assignedTo: 'Dinesh Kumar (Bar Bending Master)',
      identifiedDate: new Date('2026-10-09'),
      dueDate: new Date('2026-10-11'),
      status: 'IN_PROGRESS',
      rectificationNotes: 'Cover blocks installed on outer grid. Re-tying remaining corner rebars.',
      costImpact: 1200,
      photos: [],
      identifiedBy: contractor._id
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      snagNumber: 'SNG-2026-003',
      title: 'Water dampness & seepage trace at toilet sunken slab drainage pipe sleeve',
      description: 'Pre-cast PVC sleeve for 110mm soil pipe not sealed with non-shrink polymer mortar before waterproofing membrane application. Leakage observed in water ponding test.',
      category: 'WATERPROOFING',
      severity: 'CRITICAL',
      location: 'Tower A - 4th Floor Master Toilet Flat 402',
      tradeOrGang: 'General MEP Team',
      assignedTo: 'Govind Mandal (Plumbing Lead)',
      identifiedDate: new Date('2026-10-07'),
      dueDate: new Date('2026-10-10'),
      status: 'OPEN',
      rectificationNotes: '',
      costImpact: 3500,
      photos: [],
      identifiedBy: contractor._id
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      snagNumber: 'SNG-2026-004',
      title: 'Hollow debonded sound in 15mm cement plaster on external staircase wall',
      description: 'Tapping with wooden mallet revealed hollow debonding on 2.4 sq.m patch due to lack of surface hacking on RCC shear wall. Debonded plaster hacked down and re-plastered with bond coat.',
      category: 'MASONRY_PLASTER',
      severity: 'MAJOR',
      location: 'Tower A - Fire Staircase #1 Mid-Landing L2',
      tradeOrGang: 'Apex Civil Gang',
      assignedTo: 'Ramesh Yadav',
      identifiedDate: new Date('2026-10-05'),
      dueDate: new Date('2026-10-09'),
      status: 'RESOLVED',
      rectificationNotes: 'Cut back 2.4 sq.m hollow patch in rectangular shape. Applied SBR bond coat and re-plastered with 1:4 cement mortar. Curing in progress.',
      resolvedDate: new Date('2026-10-09'),
      costImpact: 2800,
      photos: [],
      identifiedBy: contractor._id
    },
    {
      organizationId: contractor.organizationId,
      projectId: project._id,
      snagNumber: 'SNG-2026-005',
      title: 'Unfilled formwork tie-rod through-holes in basement retaining wall',
      description: '16 Nos 25mm dia PVC sleeve holes for wall ties remained open after formwork shuttering release. Potential water ingress path from surrounding earth pressure.',
      category: 'CONCRETE',
      severity: 'MAJOR',
      location: 'Basement-1 Retaining Wall East Face',
      tradeOrGang: 'Precision Formworks',
      assignedTo: 'Jagdish Carpenter',
      identifiedDate: new Date('2026-10-03'),
      dueDate: new Date('2026-10-06'),
      status: 'VERIFIED_CLOSED',
      rectificationNotes: 'PVC cones chipped out 25mm deep. Plugged with SikaGrout 214 high-strength non-shrink expanding grout and flushed smooth. Inspected by Client QC.',
      resolvedDate: new Date('2026-10-06'),
      closedAt: new Date('2026-10-06'),
      costImpact: 1800,
      photos: [],
      identifiedBy: contractor._id,
      verifiedBy: contractor._id
    }
  ];

  const created = await Snag.insertMany(snagsData);
  console.log(`Seeded ${created.length} quality snags`);

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
