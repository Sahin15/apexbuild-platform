import Subscription from '../models/Subscription.js';
import OSPlan from '../models/OSPlan.js';
import Organization from '../models/Organization.js';
import Project from '../models/Project.js';

// Master definition of OS features and their minimum tier requirement
export const FEATURE_REGISTRY = {
  // Contractor OS Features
  coreProjects: {
    key: 'coreProjects',
    name: 'Projects & Client Directory',
    os: 'CONTRACTOR',
    requiredTier: 'STARTER',
    description: 'Basic project management, location and client records'
  },
  boqEngine: {
    key: 'boqEngine',
    name: 'BOQ & Estimates Automation',
    os: 'CONTRACTOR',
    requiredTier: 'STARTER',
    description: 'Bill of quantities, item rate breakdowns, measurement sheets'
  },
  dailyProgressReports: {
    key: 'dailyProgressReports',
    name: 'Site Daily Progress Reports (DPR)',
    os: 'CONTRACTOR',
    requiredTier: 'STARTER',
    description: 'Daily activity logging, site weather and labor attendance'
  },
  snagVault: {
    key: 'snagVault',
    name: 'Site Snag & Punchlist Vault',
    os: 'CONTRACTOR',
    requiredTier: 'PRO',
    description: 'Defect photos, severity tracking and rework cost backcharges'
  },
  pettyCashLedger: {
    key: 'pettyCashLedger',
    name: 'Site Petty Cash & Imprest Ledger',
    os: 'CONTRACTOR',
    requiredTier: 'PRO',
    description: 'Site imprest floats, supervisor vouchers and top-up settlements'
  },
  machineryDiesel: {
    key: 'machineryDiesel',
    name: 'Heavy Equipment & Fuel Telemetry',
    os: 'CONTRACTOR',
    requiredTier: 'ENTERPRISE',
    description: 'Equipment hour-meter, diesel issuance and maintenance logs'
  },
  civilPnL: {
    key: 'civilPnL',
    name: 'Cash Flow & Civil P&L Analytics',
    os: 'CONTRACTOR',
    requiredTier: 'ENTERPRISE',
    description: 'Budget vs actual variance, net cash flow projection and financial P&L'
  },
  drawingVault: {
    key: 'drawingVault',
    name: 'GFC Drawings & Revision Vault',
    os: 'CONTRACTOR',
    requiredTier: 'ENTERPRISE',
    description: 'Good-For-Construction blueprint revisions and markups vault'
  },

  // Material Supplier OS Features
  productCatalog: {
    key: 'productCatalog',
    name: 'Product & SKU Catalog',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'STARTER',
    description: 'Building materials catalog, selling rates and units'
  },
  salesOrders: {
    key: 'salesOrders',
    name: 'Sales Orders & Invoicing',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'STARTER',
    description: 'Order processing, GST invoices and payment receipts'
  },
  vehicleFleet: {
    key: 'vehicleFleet',
    name: 'Fleet Logistics & Vehicle Tracking',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'PRO',
    description: 'Truck & transit mixer fleet, driver assignments and trip dispatch'
  },
  directCustomerLedger: {
    key: 'directCustomerLedger',
    name: 'Customer Credit & Statement Ledger',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'PRO',
    description: 'Credit limits, aging receivables and monthly customer statements'
  },
  inventoryLedger: {
    key: 'inventoryLedger',
    name: 'Multi-Warehouse Stock Ledger',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'ENTERPRISE',
    description: 'Stock batch movements, bin cards and automated reorder alerts'
  },
  automatedChallans: {
    key: 'automatedChallans',
    name: 'Digital Delivery Challan & E-Signature',
    os: 'MATERIAL_SUPPLIER',
    requiredTier: 'ENTERPRISE',
    description: 'Driver mobile delivery challans and site receiver digital proof'
  },

  // Diagnostics OS Features
  patientRegistration: {
    key: 'patientRegistration',
    name: 'Patient Demographics & Registration',
    os: 'DIAGNOSTICS',
    requiredTier: 'STARTER',
    description: 'Patient records, visits and history'
  },
  testCatalog: {
    key: 'testCatalog',
    name: 'Laboratory Test Directory',
    os: 'DIAGNOSTICS',
    requiredTier: 'STARTER',
    description: 'Test catalog, sample containers and standard reference ranges'
  },
  sampleTracking: {
    key: 'sampleTracking',
    name: 'Specimen Barcoding & Tracking',
    os: 'DIAGNOSTICS',
    requiredTier: 'PRO',
    description: 'Phlebotomy barcode accessioning and specimen status'
  },
  doctorCommissions: {
    key: 'doctorCommissions',
    name: 'Doctor Referral Commission Engine',
    os: 'DIAGNOSTICS',
    requiredTier: 'ENTERPRISE',
    description: 'Doctor cuts ledger, referral percentage payouts and tax deductions'
  },
  automatedDispatch: {
    key: 'automatedDispatch',
    name: 'Automated WhatsApp & PDF Dispatch',
    os: 'DIAGNOSTICS',
    requiredTier: 'ENTERPRISE',
    description: 'Instant verified report dispatch to patient WhatsApp & email'
  },
  qualityControl: {
    key: 'qualityControl',
    name: 'Clinical Quality Control & Levey-Jennings',
    os: 'DIAGNOSTICS',
    requiredTier: 'ENTERPRISE',
    description: 'Daily control run validation, standard deviation and analyzer QC'
  },

  // Chicken Distributor OS Features
  dailySalesLedger: {
    key: 'dailySalesLedger',
    name: 'Sales Deliveries & Invoicing',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'STARTER',
    description: 'Order billing, customer accounts, and bird weights'
  },
  supplierPurchases: {
    key: 'supplierPurchases',
    name: 'Supplier Procurement & Settlement',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'STARTER',
    description: 'Poultry purchases, payment vouchers, and mortality entry'
  },
  preOrderEstimations: {
    key: 'preOrderEstimations',
    name: 'Advance Pre-Orders & Estimation Engine',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'PRO',
    description: 'Next-day crate allocation and forecasting calculator'
  },
  driverMobileApp: {
    key: 'driverMobileApp',
    name: 'Driver Real-time Fleet Telemetry & App',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'PRO',
    description: 'Driver vehicle run logs, diesel tracking and route trip audit'
  },
  multiDepotStock: {
    key: 'multiDepotStock',
    name: 'Multi-Depot Stock & Live Variance Ledger',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'ENTERPRISE',
    description: 'Multi-location bird inventory, shrinkage and mortality variance P&L'
  },
  financialVariancePnL: {
    key: 'financialVariancePnL',
    name: 'Daily Margin & Variance P&L Analytics',
    os: 'CHICKEN_DISTRIBUTOR',
    requiredTier: 'ENTERPRISE',
    description: 'Live weight variance reconciliation and daily margin P&L analytics'
  }
};

class EntitlementService {
  /**
   * Resolves the complete entitlements and usage limits for a given organization
   */
  async getTenantEntitlements(organizationId) {
    if (!organizationId) {
      return this._getDefaultEmptyEntitlements('STARTER');
    }

    const org = await Organization.findById(organizationId).lean();
    if (!org) {
      return this._getDefaultEmptyEntitlements('STARTER');
    }

    if (org.businessType === 'SUPERADMIN') {
      return this._getSuperadminEntitlements();
    }

    // Find active subscription
    const sub = await Subscription.findOne({
      organizationId,
      status: { $in: ['ACTIVE', 'active', 'PENDING_APPROVAL', 'PENDING_PAYMENT'] }
    }).populate('osPlanId').lean();

    const plan = sub?.osPlanId || null;
    const planTier = (plan?.tier || '').toUpperCase();
    let tier = 'STARTER';
    if (planTier === 'ENTERPRISE' || planTier === 'PRO') {
      tier = 'ENTERPRISE';
    } else if (plan?.name) {
      const lower = plan.name.toLowerCase();
      if (lower.includes('enterprise') || lower.includes('suite') || lower.includes('fleet') || lower.includes('lims')) {
        tier = 'ENTERPRISE';
      }
    }

    // Default entitlements for this tier & OS
    const resolvedEntitlements = {};
    const osType = org.businessType;

    for (const [key, feat] of Object.entries(FEATURE_REGISTRY)) {
      if (feat.os === osType || feat.os === 'ALL') {
        resolvedEntitlements[key] = this._isTierSufficient(tier, feat.requiredTier);
      }
    }

    // Apply Plan featureEntitlements if explicitly set
    if (plan?.featureEntitlements && typeof plan.featureEntitlements === 'object') {
      for (const [k, v] of Object.entries(plan.featureEntitlements)) {
        if (typeof v === 'boolean') resolvedEntitlements[k] = v;
      }
    }

    // Apply Tenant customEntitlements overrides from subscription (Superadmin custom grants)
    if (sub?.customEntitlements && typeof sub.customEntitlements === 'object') {
      for (const [k, v] of Object.entries(sub.customEntitlements)) {
        if (typeof v === 'boolean') resolvedEntitlements[k] = v;
      }
    }

    // Usage limits
    const usageLimits = {
      maxProjects: tier === 'ENTERPRISE' ? -1 : (tier === 'PRO' ? 10 : 3),
      storageGB: tier === 'ENTERPRISE' ? 100 : (tier === 'PRO' ? 25 : 5),
      maxUsers: tier === 'ENTERPRISE' ? -1 : (tier === 'PRO' ? 15 : 5)
    };

    if (plan?.usageLimits) {
      if (plan.usageLimits.projects !== undefined) usageLimits.maxProjects = plan.usageLimits.projects;
      if (plan.usageLimits.storageGB !== undefined) usageLimits.storageGB = plan.usageLimits.storageGB;
      if (plan.usageLimits.users !== undefined) usageLimits.maxUsers = plan.usageLimits.users;
    }

    if (sub?.customUsageLimits) {
      Object.assign(usageLimits, sub.customUsageLimits);
    }

    return {
      organizationId,
      organizationName: org.name,
      businessType: org.businessType,
      tier,
      planName: plan?.name || `${tier} Plan`,
      subscriptionId: sub?._id || null,
      billingCycle: sub?.billingCycle || 'monthly',
      status: sub?.status || 'ACTIVE',
      entitlements: resolvedEntitlements,
      features: resolvedEntitlements,
      limits: usageLimits
    };
  }

  /**
   * Checks whether an organization is entitled to a specific feature
   */
  async checkEntitlement(organizationId, featureKey) {
    const meta = FEATURE_REGISTRY[featureKey] || {
      key: featureKey,
      name: featureKey,
      requiredTier: 'PRO',
      description: 'Advanced Feature'
    };

    const details = await this.getTenantEntitlements(organizationId);
    const isEntitled = Boolean(details.entitlements[featureKey]);

    return {
      isEntitled,
      featureKey,
      featureName: meta.name,
      requiredTier: meta.requiredTier,
      currentTier: details.tier,
      planName: details.planName
    };
  }

  /**
   * Checks whether creating a new resource would exceed the plan usage limit
   */
  async checkProjectLimit(organizationId) {
    const details = await this.getTenantEntitlements(organizationId);
    const max = details.limits.maxProjects;

    if (max === -1) {
      return { allowed: true, current: 0, max: -1 };
    }

    const current = await Project.countDocuments({ organizationId });
    return {
      allowed: current < max,
      current,
      max,
      remaining: Math.max(0, max - current)
    };
  }

  _isTierSufficient(currentTier, requiredTier) {
    if (requiredTier === 'STARTER') return true;
    return currentTier === 'ENTERPRISE' || currentTier === 'PRO';
  }

  _getSuperadminEntitlements() {
    const allTrue = {};
    for (const key of Object.keys(FEATURE_REGISTRY)) {
      allTrue[key] = true;
    }
    return {
      organizationId: null,
      organizationName: 'Superadmin Console',
      businessType: 'SUPERADMIN',
      tier: 'ENTERPRISE',
      planName: 'Platform Superadmin',
      status: 'ACTIVE',
      entitlements: allTrue,
      features: allTrue,
      limits: { maxProjects: -1, storageGB: 10000, maxUsers: -1 }
    };
  }

  _getDefaultEmptyEntitlements(tier = 'STARTER') {
    return {
      organizationId: null,
      organizationName: 'Default',
      businessType: 'CONTRACTOR',
      tier,
      planName: 'Starter Free Plan',
      status: 'ACTIVE',
      entitlements: {},
      features: {},
      limits: { maxProjects: 3, storageGB: 5, maxUsers: 5 }
    };
  }
}

export default new EntitlementService();
