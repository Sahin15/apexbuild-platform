import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Project from '../models/Project.js';
import DistributorSale from '../models/DistributorSale.js';
import Patient from '../models/Patient.js';
import SupplierOrder from '../models/SupplierOrder.js';

export const getGodViewAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Core Financials (already partially in SuperAdminController, but we can enrich)
    const activeSubs = await Subscription.find({ status: 'ACTIVE' });
    let mrr = 0;
    let arr = 0;
    activeSubs.forEach(sub => {
      if (sub.billingCycle === 'monthly') { mrr += sub.finalAmount; arr += sub.finalAmount * 12; }
      else if (sub.billingCycle === 'yearly') { arr += sub.finalAmount; mrr += sub.finalAmount / 12; }
    });

    // 2. Resource Utilization
    const totalUsers = await User.countDocuments();
    const activeUsersToday = await User.countDocuments({ lastLoginAt: { $gte: today } });
    const totalOrgs = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' } });

    // 3. Contractor OS Telemetry (Total Construction Project Value)
    const projects = await Project.aggregate([
      { $group: { _id: null, totalBudget: { $sum: "$budget" }, count: { $sum: 1 } } }
    ]);
    const contractorStats = projects[0] || { totalBudget: 0, count: 0 };

    // 4. Distributor OS Telemetry (Total Tonnage Shipped)
    const distributorSales = await DistributorSale.aggregate([
      { $match: { saleDate: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, totalWeight: { $sum: "$weight" }, revenue: { $sum: "$netAmount" } } }
    ]);
    const distributorStats = distributorSales[0] || { totalWeight: 0, revenue: 0 };

    // 5. Diagnostics OS Telemetry (Patients Processed)
    const patientsThisMonth = await Patient.countDocuments({ createdAt: { $gte: firstDayOfMonth } });
    
    // 6. Supplier OS Telemetry (Total Supply Orders)
    const supplierOrders = await SupplierOrder.aggregate([
      { $match: { createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, totalValue: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);
    const supplierStats = supplierOrders[0] || { totalValue: 0, count: 0 };

    res.status(200).json({
      status: 'success',
      data: {
        financials: { mrr: Math.round(mrr), arr: Math.round(arr) },
        resources: { totalUsers, activeUsersToday, totalOrgs },
        telemetry: {
          contractor: { activeProjects: contractorStats.count, totalBudgetManaged: contractorStats.totalBudget },
          distributor: { monthlyTonnage: distributorStats.totalWeight, monthlyRevenue: distributorStats.revenue },
          diagnostics: { monthlyPatients: patientsThisMonth },
          supplier: { monthlyOrders: supplierStats.count, monthlyValue: supplierStats.totalValue }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};
