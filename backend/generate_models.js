import fs from 'fs';
import path from 'path';

const modelsDir = path.join(process.cwd(), 'src', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = {
  Organization: `import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  legalName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  logo: { type: String },
  settings: { type: Object, default: {} },
  subscription: { type: String, default: 'free' },
  status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);`,
  
  User: `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'SUPERVISOR', 'STORE_MANAGER', 'VIEWER'],
    default: 'VIEWER' 
  },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default mongoose.model('User', userSchema);`,

  Project: `import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  projectCode: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  projectType: { type: String },
  location: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  contractValue: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 },
  startDate: { type: Date },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },
  status: { 
    type: String, 
    enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], 
    default: 'PLANNING' 
  },
  projectManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  progress: { type: Number, default: 0 },
  settings: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);`,

  Client: `import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  companyName: { type: String },
  email: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  contactPerson: { type: String },
  notes: { type: String },
  status: { type: String, default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);`,

  BOQ: `import mongoose from 'mongoose';

const boqSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  version: { type: String, default: 'v1.0' },
  status: { type: String, enum: ['DRAFT', 'APPROVED', 'LOCKED'], default: 'DRAFT' },
  totalAmount: { type: Number, default: 0 },
  importedFrom: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('BOQ', boqSchema);`,

  BOQItem: `import mongoose from 'mongoose';

const boqItemSchema = new mongoose.Schema({
  boqId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sectionId: { type: String },
  itemCode: { type: String },
  description: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  completedQuantity: { type: Number, default: 0 },
  remainingQuantity: { type: Number, required: true },
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });

// Ensure remainingQuantity and amount are calculated correctly
boqItemSchema.pre('save', function (next) {
  this.amount = this.quantity * this.rate;
  this.remainingQuantity = this.quantity - this.completedQuantity;
  next();
});

export default mongoose.model('BOQItem', boqItemSchema);`,

  SiteReport: `import mongoose from 'mongoose';

const siteReportSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reportDate: { type: Date, required: true },
  siteEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weather: { type: String },
  workCompleted: { type: String },
  overallProgress: { type: Number, default: 0 },
  manpowerSummary: { type: Object },
  materialSummary: { type: Object },
  equipmentSummary: { type: Object },
  issues: { type: String },
  delays: { type: String },
  safetyObservations: { type: String },
  nextDayPlan: { type: String },
  photos: [{ type: String }],
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SiteReport', siteReportSchema);`
};

for (const [modelName, schemaContent] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsDir, `${modelName}.js`), schemaContent);
}

console.log('Core models created successfully.');
