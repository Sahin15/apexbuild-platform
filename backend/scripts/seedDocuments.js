import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Document from '../src/models/Document.js';
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

  // Clear existing documents for this project
  await Document.deleteMany({ organizationId: contractor.organizationId, projectId: project._id });

  // 1. Seed Drawings (with revision history)
  
  // STR-FDN-001 (R0 superseded, R1 active)
  const fdnR0 = await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Foundation Raft & Pile Cap Layout & Reinforcement',
    description: 'Initial structural foundation layout as per tender geotech report.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'STR-FDN-001',
    discipline: 'STRUCTURAL',
    revision: 'R0',
    revisionNotes: 'Initial tender release for estimation and site excavation setup',
    status: 'SUPERSEDED',
    issuedBy: 'Sterling Structural Consultants LLP',
    releaseDate: new Date('2025-11-10'),
    fileUrl: 'https://apexbuild-vault.internal/drawings/STR-FDN-001_R0.pdf',
    fileName: 'STR-FDN-001_R0_Foundation_Raft.pdf',
    fileType: 'pdf',
    fileSize: 4200000,
    tags: ['Foundation', 'Raft', 'Piles', 'Structural'],
    uploadedBy: contractor._id
  });

  const fdnR1 = await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Foundation Raft & Pile Cap Layout & Reinforcement',
    description: 'Revised raft thickness from 750mm to 900mm in Zone B as per Proof Consultant vetting.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'STR-FDN-001',
    discipline: 'STRUCTURAL',
    revision: 'R1',
    revisionNotes: 'Raft thickness revised to 900mm; bottom rebar increased to 25mm dia @ 125mm c/c.',
    status: 'GFC_ACTIVE',
    issuedBy: 'Sterling Structural Consultants LLP (Vetted by IIT Proof Consultant)',
    releaseDate: new Date('2026-01-15'),
    previousRevision: fdnR0._id,
    fileUrl: 'https://apexbuild-vault.internal/drawings/STR-FDN-001_R1.pdf',
    fileName: 'STR-FDN-001_R1_Foundation_Raft_GFC.pdf',
    fileType: 'pdf',
    fileSize: 4850000,
    tags: ['Foundation', 'Raft', 'GFC', 'Structural'],
    uploadedBy: contractor._id
  });

  fdnR0.supersededBy = fdnR1._id;
  await fdnR0.save();

  // STR-COL-004 (R1 superseded, R2 active)
  const colR1 = await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Columns C1 to C12 Reinforcement & Lap Splice Schedule',
    description: 'Column schedule from Foundation to 4th Floor level.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'STR-COL-004',
    discipline: 'STRUCTURAL',
    revision: 'R1',
    revisionNotes: 'Lap splice zone confined with 8mm ties @ 100mm c/c as per IS 13920 ductile detailing.',
    status: 'SUPERSEDED',
    issuedBy: 'Sterling Structural Consultants LLP',
    releaseDate: new Date('2026-01-20'),
    fileUrl: 'https://apexbuild-vault.internal/drawings/STR-COL-004_R1.pdf',
    fileName: 'STR-COL-004_R1_Columns_C1_C12.pdf',
    fileType: 'pdf',
    fileSize: 3100000,
    tags: ['Columns', 'Ductile Detailing', 'IS13920'],
    uploadedBy: contractor._id
  });

  const colR2 = await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Columns C1 to C12 Reinforcement & Lap Splice Schedule',
    description: 'Revised lap locations shifted to middle half of clear column height. GFC Stamped.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'STR-COL-004',
    discipline: 'STRUCTURAL',
    revision: 'R2',
    revisionNotes: 'Columns C3 & C7 main rebar upgraded to 8 Nos. 28mm dia Fe 550D.',
    status: 'GFC_ACTIVE',
    issuedBy: 'Sterling Structural Consultants LLP',
    releaseDate: new Date('2026-02-18'),
    previousRevision: colR1._id,
    fileUrl: 'https://apexbuild-vault.internal/drawings/STR-COL-004_R2.pdf',
    fileName: 'STR-COL-004_R2_Columns_GFC_Stamped.pdf',
    fileType: 'pdf',
    fileSize: 3450000,
    tags: ['Columns', 'GFC', 'Rebar', 'HighPriority'],
    uploadedBy: contractor._id
  });

  colR1.supersededBy = colR2._id;
  await colR1.save();

  // ARCH-GA-002
  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Typical Floor Architectural Layout & Masonry Grid Plan',
    description: 'Approved architectural floor plan showing 200mm external AAC blockwork and 100mm internal partitions.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'ARCH-GA-002',
    discipline: 'ARCHITECTURAL',
    revision: 'R0',
    revisionNotes: 'GFC release signed by Principal Architect & Chief Project Engineer.',
    status: 'GFC_ACTIVE',
    issuedBy: 'Studio Habitat Architects',
    releaseDate: new Date('2026-02-05'),
    fileUrl: 'https://apexbuild-vault.internal/drawings/ARCH-GA-002_R0.pdf',
    fileName: 'ARCH-GA-002_R0_Architectural_Floor_Plan.pdf',
    fileType: 'pdf',
    fileSize: 5200000,
    tags: ['Architectural', 'AAC Blockwork', 'GFC'],
    uploadedBy: contractor._id
  });

  // MEP-SAN-003
  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: 'Soil, Waste & Rainwater Drainage Vertical Shaft Riser Details',
    description: 'Plumbing shaft layout with UPVC pipe sleeve core-cut coordinates for slab casting.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'MEP-SAN-003',
    discipline: 'MEP_PLUMBING',
    revision: 'R1',
    revisionNotes: 'Vertical shaft expanded by 150mm to accommodate dual rainwater harvesting down-takes.',
    status: 'GFC_ACTIVE',
    issuedBy: 'AquaTech MEP Engineers',
    releaseDate: new Date('2026-02-28'),
    fileUrl: 'https://apexbuild-vault.internal/drawings/MEP-SAN-003_R1.pdf',
    fileName: 'MEP-SAN-003_R1_Plumbing_Shaft_GFC.pdf',
    fileType: 'pdf',
    fileSize: 2900000,
    tags: ['Plumbing', 'Drainage', 'Sleeves', 'GFC'],
    uploadedBy: contractor._id
  });

  // STR-SLB-006 (Under review)
  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'DRAWING_GFC',
    title: '5th & 6th Floor Cantilever Balcony Beam & Slab Details',
    description: 'Cantilever balcony structural detailing. Submitted to Client Executive Engineer for vetting.',
    category: 'Drawings & Blueprints',
    drawingNumber: 'STR-SLB-006',
    discipline: 'STRUCTURAL',
    revision: 'R0',
    revisionNotes: 'Under vetting for wind load deflection at building corners.',
    status: 'UNDER_REVIEW',
    issuedBy: 'Sterling Structural Consultants LLP',
    releaseDate: new Date('2026-03-02'),
    fileUrl: 'https://apexbuild-vault.internal/drawings/STR-SLB-006_R0.pdf',
    fileName: 'STR-SLB-006_R0_Balcony_Draft.pdf',
    fileType: 'pdf',
    fileSize: 3800000,
    tags: ['Balcony', 'Cantilever', 'UnderReview'],
    uploadedBy: contractor._id
  });

  // 2. Seed Quality & Concrete Cube Test Certificates
  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'QUALITY_CERTIFICATE',
    title: '28-Day Concrete Cube Compressive Strength Report - M30 Columns',
    description: '3 cube samples tested at 28 days as per IS 516. Crushing strength tested under calibrated CTM.',
    category: 'Quality & Test Certificates',
    testType: 'CONCRETE_CUBE_TEST',
    certificateNumber: 'NABL-2026-CUB-104',
    testingAgency: 'State Material & Highway Testing Lab (NABL TC-5821)',
    testDate: new Date('2026-02-25'),
    concreteGrade: 'M30',
    locationElement: 'Tower A - 3rd Floor Columns C1 to C8 (Pour #1)',
    sevenDayStrength: 23.4,
    twentyEightDayStrength: 36.8,
    targetStrength: 30.0,
    complianceStatus: 'PASS',
    fileUrl: 'https://apexbuild-vault.internal/certs/NABL-2026-CUB-104.pdf',
    fileName: 'NABL_TestCert_M30_Columns_28Day.pdf',
    fileType: 'pdf',
    fileSize: 1200000,
    tags: ['CubeTest', 'M30', 'Columns', 'NABL', 'Passed'],
    uploadedBy: contractor._id
  });

  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'QUALITY_CERTIFICATE',
    title: '7-Day Concrete Cube Compressive Strength Report - M35 Transfer Girder',
    description: '7-day test for heavy transfer girder at podium level to permit formwork de-shuttering.',
    category: 'Quality & Test Certificates',
    testType: 'CONCRETE_CUBE_TEST',
    certificateNumber: 'NABL-2026-CUB-112',
    testingAgency: 'State Material & Highway Testing Lab (NABL TC-5821)',
    testDate: new Date('2026-03-01'),
    concreteGrade: 'M35',
    locationElement: 'Podium Level Transfer Girder TG-1 (Grid 4-D)',
    sevenDayStrength: 28.5,
    twentyEightDayStrength: 0,
    targetStrength: 24.5,
    complianceStatus: 'PASS',
    fileUrl: 'https://apexbuild-vault.internal/certs/NABL-2026-CUB-112.pdf',
    fileName: 'NABL_TestCert_M35_7Day_TransferGirder.pdf',
    fileType: 'pdf',
    fileSize: 1150000,
    tags: ['CubeTest', 'M35', '7Day', 'Passed'],
    uploadedBy: contractor._id
  });

  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'QUALITY_CERTIFICATE',
    title: 'Tata Tiscon Fe 550D TMT Steel Mill Test Certificate (MTC)',
    description: 'Heat & Batch inspection certificate for 16mm & 20mm Dia rebar shipment (32 Metric Tonnes).',
    category: 'Quality & Test Certificates',
    testType: 'STEEL_MTC',
    certificateNumber: 'TATA-MTC-550D-892',
    testingAgency: 'Tata Steel Jamshedpur QA Division (IS 1786 Certified)',
    testDate: new Date('2026-02-12'),
    concreteGrade: 'N/A',
    locationElement: 'Lot #B49 - 32 MT Fe550D Rebar',
    sevenDayStrength: 0,
    twentyEightDayStrength: 0,
    targetStrength: 550,
    complianceStatus: 'PASS',
    fileUrl: 'https://apexbuild-vault.internal/certs/TATA-MTC-550D-892.pdf',
    fileName: 'Tata_Tiscon_Fe550D_MTC_Batch892.pdf',
    fileType: 'pdf',
    fileSize: 2100000,
    tags: ['Steel', 'TMT', 'Fe550D', 'MTC', 'Passed'],
    uploadedBy: contractor._id
  });

  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'QUALITY_CERTIFICATE',
    title: 'Core Cutter Soil Compaction & Dry Density Test Report',
    description: 'Field dry density test of road subgrade & basement backfill embankment as per IS 2720.',
    category: 'Quality & Test Certificates',
    testType: 'SOIL_COMPACTION',
    certificateNumber: 'SOIL-PROCT-041',
    testingAgency: 'Geotech & Earth Sciences Research Lab',
    testDate: new Date('2026-02-16'),
    concreteGrade: 'N/A',
    locationElement: 'Basement Retaining Wall Perimeter Backfill',
    sevenDayStrength: 0,
    twentyEightDayStrength: 0,
    targetStrength: 97,
    complianceStatus: 'PASS',
    fileUrl: 'https://apexbuild-vault.internal/certs/SOIL-PROCT-041.pdf',
    fileName: 'Soil_Compaction_Test_Report_041.pdf',
    fileType: 'pdf',
    fileSize: 1450000,
    tags: ['Soil', 'Compaction', 'IS2720', 'Passed'],
    uploadedBy: contractor._id
  });

  // 3. Seed Contract & Statutory Vault
  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'CONTRACT_AGREEMENT',
    title: 'Contract Agreement & CPWD Letter of Acceptance (LOA)',
    description: 'Original signed contract agreement with schedule of rates, milestone timeline, and bank guarantee conditions.',
    category: 'Contracts & Agreements',
    fileUrl: 'https://apexbuild-vault.internal/legal/CPWD_Contract_LOA_2025.pdf',
    fileName: 'CPWD_Signed_Agreement_LOA.pdf',
    fileType: 'pdf',
    fileSize: 8400000,
    tags: ['Agreement', 'LOA', 'Contract', 'Legal'],
    uploadedBy: contractor._id
  });

  await Document.create({
    organizationId: contractor.organizationId,
    projectId: project._id,
    docType: 'SITE_RECORD',
    title: 'Provisional Fire Safety NOC & Building Plan Approval Endorsement',
    description: 'Department of Fire & Emergency Services approval for vehicular ring road and wet riser shaft.',
    category: 'Contracts & Agreements',
    fileUrl: 'https://apexbuild-vault.internal/legal/Fire_Safety_NOC_Prov.pdf',
    fileName: 'Fire_Safety_Provisional_NOC.pdf',
    fileType: 'pdf',
    fileSize: 1950000,
    tags: ['NOC', 'FireSafety', 'Approval'],
    uploadedBy: contractor._id
  });

  console.log('Seeded GFC drawings, revisions, NABL cube test certificates, and contract agreements successfully.');
  await mongoose.disconnect();
}

seed().catch(console.error);
