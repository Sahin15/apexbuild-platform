import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import Test from '../models/Test.js';
import Sample from '../models/Sample.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Patients
    const totalPatients = await Patient.countDocuments({ organizationId: orgId });
    const newPatientsToday = await Patient.countDocuments({ organizationId: orgId, createdAt: { $gte: today } });

    // 2. Orders & Revenue Today
    const todayOrders = await Order.find({ organizationId: orgId, createdAt: { $gte: today } });
    const revenueToday = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const collectionsToday = todayOrders.reduce((sum, order) => sum + order.paidAmount, 0);

    // 3. Samples Status
    const pendingSamples = await Sample.countDocuments({ organizationId: orgId, status: 'Pending' });
    const inLabSamples = await Sample.countDocuments({ organizationId: orgId, status: { $in: ['In Lab', 'Processing'] } });

    // 4. Reports Status
    const ordersPendingResults = await Order.countDocuments({ organizationId: orgId, orderStatus: { $in: ['Registered', 'Sample Pending', 'Collected', 'Partial Results'] } });
    const completedOrdersToday = await Order.countDocuments({ organizationId: orgId, orderStatus: 'Completed', updatedAt: { $gte: today } });

    res.status(200).json({
      status: 'success',
      data: {
        patients: { total: totalPatients, newToday: newPatientsToday },
        revenue: { totalToday: revenueToday, collectionsToday },
        orders: { totalToday: todayOrders.length, completedToday: completedOrdersToday, pendingResults: ordersPendingResults },
        samples: { pending: pendingSamples, inLab: inLabSamples }
      }
    });
  } catch (error) {
    next(error);
  }
};
