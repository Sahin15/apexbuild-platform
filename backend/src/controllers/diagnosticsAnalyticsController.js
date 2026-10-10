import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import Test from '../models/Test.js';
import Sample from '../models/Sample.js';
import Doctor from '../models/Doctor.js';
import LabPaymentReceipt from '../models/LabPaymentReceipt.js';
import QualityControl from '../models/QualityControl.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total Patients & New Today
    const totalPatients = await Patient.countDocuments({ organizationId: orgId });
    const newPatientsToday = await Patient.countDocuments({ organizationId: orgId, createdAt: { $gte: today } });

    // 2. Orders & Revenue Today
    const todayOrders = await Order.find({ organizationId: orgId, createdAt: { $gte: today } });
    const revenueToday = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const collectionsToday = todayOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);

    // 3. Samples Status
    const pendingSamples = await Sample.countDocuments({ organizationId: orgId, status: 'Pending' });
    const inLabSamples = await Sample.countDocuments({ organizationId: orgId, status: { $in: ['In Lab', 'Processing'] } });

    // 4. Reports Status
    const ordersPendingResults = await Order.countDocuments({ 
      organizationId: orgId, 
      orderStatus: { $in: ['Registered', 'Sample Pending', 'Collected', 'Partial Results'] } 
    });
    const completedOrdersToday = await Order.countDocuments({ 
      organizationId: orgId, 
      orderStatus: 'Completed', 
      updatedAt: { $gte: today } 
    });

    // 5. 7-Day Revenue & Volume Trend (Dynamic Aggregation)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastOrders = await Order.find({
      organizationId: orgId,
      createdAt: { $gte: sevenDaysAgo }
    }).select('totalAmount paidAmount createdAt tests orderStatus');

    // Group into 7 distinct day buckets
    const daysMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap[dayKey] = {
        name: dayKey,
        dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: 0,
        collections: 0,
        orders: 0
      };
    }

    pastOrders.forEach(ord => {
      const dayKey = new Date(ord.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (daysMap[dayKey]) {
        daysMap[dayKey].revenue += (ord.totalAmount || 0);
        daysMap[dayKey].collections += (ord.paidAmount || 0);
        daysMap[dayKey].orders += 1;
      }
    });

    const weeklyTrendData = Object.values(daysMap);

    // 6. Departmental Distribution from real Tests
    const allTests = await Test.find({ organizationId: orgId }).select('category');
    const deptCounts = {};
    allTests.forEach(t => {
      const cat = t.category || 'General';
      deptCounts[cat] = (deptCounts[cat] || 0) + 1;
    });

    const departmentData = Object.keys(deptCounts).map(dept => ({
      name: dept,
      value: deptCounts[dept]
    }));

    // If empty, supply standard clinical distribution
    if (departmentData.length === 0) {
      departmentData.push(
        { name: 'Hematology', value: 12 },
        { name: 'Biochemistry', value: 18 },
        { name: 'Microbiology', value: 8 },
        { name: 'Serology', value: 6 }
      );
    }

    // 7. Top Referring Doctors & Referral Contribution Matrix
    const doctors = await Doctor.find({ organizationId: orgId })
      .select('name specialization hospital totalReferrals totalCommission commissionPercentage contactNumber')
      .sort({ totalReferrals: -1 })
      .limit(5);

    // 8. Quality Control (IQC) Health status
    const qcLots = await QualityControl.find({ organizationId: orgId, status: 'ACTIVE' });
    let totalQCLots = qcLots.length;
    let outOfControlLots = 0;
    let warningLots = 0;

    qcLots.forEach(lot => {
      const lastRun = lot.runs?.length ? lot.runs[lot.runs.length - 1] : null;
      if (lastRun?.status === 'OUT_OF_CONTROL') outOfControlLots++;
      else if (lastRun?.status === 'WARNING') warningLots++;
    });

    res.status(200).json({
      status: 'success',
      data: {
        patients: { total: totalPatients, newToday: newPatientsToday },
        revenue: { totalToday: revenueToday, collectionsToday },
        orders: { totalToday: todayOrders.length, completedToday: completedOrdersToday, pendingResults: ordersPendingResults },
        samples: { pending: pendingSamples, inLab: inLabSamples },
        weeklyTrendData,
        departmentData,
        topDoctors: doctors,
        qcSummary: {
          totalLots: totalQCLots,
          inControlLots: totalQCLots - outOfControlLots - warningLots,
          warningLots,
          outOfControlLots,
          status: outOfControlLots > 0 ? 'ALERT' : warningLots > 0 ? 'WARNING' : 'HEALTHY'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
