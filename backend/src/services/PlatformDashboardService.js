import Organization from '../models/Organization.js';
import Subscription from '../models/Subscription.js';
import OSProduct from '../models/OSProduct.js';
import Payment from '../models/Payment.js'; // Assuming it exists
import User from '../models/User.js';

class PlatformDashboardService {
  async getDashboardSummary() {
    // Business Account Counts
    const totalBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' } });
    const activeBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'active' });
    const pendingBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'pending' });
    const restrictedBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'restricted' });
    const suspendedBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'suspended' });
    const paymentPendingBusinesses = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'payment_pending' });

    // OS Adoption & Products
    // Aggregate organizations by businessType to count OS adoption
    const osAdoptionRaw = await Organization.aggregate([
      { $match: { businessType: { $ne: 'SUPERADMIN' } } },
      { $group: { _id: '$businessType', count: { $sum: 1 } } }
    ]);

    const osMapping = {
      'CONTRACTOR': 'Contractor OS',
      'MATERIAL_SUPPLIER': 'Supply OS',
      'CHICKEN_DISTRIBUTOR': 'Distribution OS',
      'DIAGNOSTICS': 'Diagnostics OS',
      'PHARMACY': 'Pharmacy OS',
      'RESTAURANT': 'Restaurant OS',
      'EDUCATION': 'Education OS'
    };

    const osAdoption = osAdoptionRaw.map(item => ({
      osName: osMapping[item._id] || item._id,
      businessType: item._id,
      businesses: item.count,
      percentage: totalBusinesses > 0 ? Math.round((item.count / totalBusinesses) * 100) : 0,
      status: 'Active'
    }));

    // Missing OS defaults
    Object.keys(osMapping).forEach(key => {
      if (!osAdoption.find(o => o.businessType === key)) {
        osAdoption.push({
          osName: osMapping[key],
          businessType: key,
          businesses: 0,
          percentage: 0,
          status: 'Active'
        });
      }
    });

    // Subscriptions
    const activeSubscriptions = await Subscription.find({ status: 'ACTIVE' });
    const totalActiveSubscriptions = activeSubscriptions.length;

    // Revenue Calculation
    let mrr = 0;
    let arr = 0;
    activeSubscriptions.forEach(sub => {
      if (sub.billingCycle === 'monthly') {
        mrr += sub.finalAmount;
        arr += sub.finalAmount * 12;
      } else if (sub.billingCycle === 'yearly') {
        arr += sub.finalAmount;
        mrr += sub.finalAmount / 12;
      }
    });

    // We'll mock missing revenue components safely returning 0 until models are populated
    const totalRevenue = arr; 
    const outstandingPayments = 0; // Requires full invoice/payment module
    const implementationRevenue = 0; // Requires full invoice module

    // Recent Business Accounts
    const recentAccounts = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } })
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Pending Approvals Queue
    const pendingApprovalsQueue = await Organization.find({ businessType: { $ne: 'SUPERADMIN' }, status: 'pending' })
      .sort('createdAt')
      .limit(5)
      .lean();

    // Payment Queue
    let paymentVerificationQueue = [];
    try {
        paymentVerificationQueue = await Payment.find({ status: 'PENDING_VERIFICATION' })
            .populate('organizationId', 'name')
            .sort('createdAt')
            .limit(5)
            .lean();
    } catch (e) {
        // Payment model might not exist or be fully featured yet
    }

    // New businesses this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newBusinessesThisMonth = await Organization.countDocuments({ 
        businessType: { $ne: 'SUPERADMIN' }, 
        createdAt: { $gte: startOfMonth } 
    });

    return {
      kpi: {
        totalBusinesses,
        activeBusinesses,
        pendingApprovals: pendingBusinesses,
        paymentPending: paymentPendingBusinesses,
        totalRevenue,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        outstandingPayments,
        activeSubscriptions: totalActiveSubscriptions,
        restrictedAccounts: restrictedBusinesses,
        suspendedAccounts: suspendedBusinesses,
        newBusinessesThisMonth,
        renewalsDueSoon: 0, // Placeholder
        implementationRevenue
      },
      osAdoption,
      recentAccounts: recentAccounts.map(org => ({
        id: org._id,
        name: org.name,
        businessType: org.businessType,
        osName: osMapping[org.businessType] || org.businessType,
        owner: org.ownerName || 'Unknown',
        status: org.status,
        createdAt: org.createdAt
      })),
      pendingApprovalsQueue: pendingApprovalsQueue.map(org => ({
        id: org._id,
        name: org.name,
        owner: org.ownerName || 'Unknown',
        requestedOs: osMapping[org.businessType] || org.businessType,
        createdAt: org.createdAt,
        status: org.status
      })),
      paymentVerificationQueue: paymentVerificationQueue.map(payment => ({
        id: payment._id,
        businessName: payment.organizationId?.name || 'Unknown',
        amount: payment.amount,
        type: payment.paymentMethod || 'Manual',
        date: payment.createdAt,
        status: payment.status
      }))
    };
  }
}

export default new PlatformDashboardService();
