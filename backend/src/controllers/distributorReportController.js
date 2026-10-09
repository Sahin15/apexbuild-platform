import DistributorSale from '../models/DistributorSale.js';
import DistributorPurchase from '../models/DistributorPurchase.js';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorExpense from '../models/DistributorExpense.js';
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorSupplier from '../models/DistributorSupplier.js';

export const getReportSummary = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchDate = { $gte: start, $lte: end };

    // 1. Sales Aggregation
    const salesData = await DistributorSale.aggregate([
      { $match: { organizationId: orgId, saleDate: matchDate } },
      { $group: {
          _id: null,
          totalWeight: { $sum: '$weight' },
          totalGross: { $sum: '$grossAmount' },
          totalNet: { $sum: '$netAmount' },
          totalPaid: { $sum: '$paidAmount' }
      }}
    ]);

    // 2. Purchases Aggregation
    const purchasesData = await DistributorPurchase.aggregate([
      { $match: { organizationId: orgId, purchaseDate: matchDate } },
      { $group: {
          _id: null,
          totalWeight: { $sum: '$weight' },
          totalGross: { $sum: '$grossAmount' },
          totalNet: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' }
      }}
    ]);

    // 3. Collections (Payments from Customers)
    const collectionsData = await DistributorPayment.aggregate([
      { $match: { organizationId: orgId, type: 'CUSTOMER_COLLECTION', date: matchDate } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 4. Expenses Aggregation
    const expensesData = await DistributorExpense.aggregate([
      { $match: { organizationId: orgId, date: matchDate } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 5. Shop-wise Performance (for this specific date range)
    const shopPerformance = await DistributorSale.aggregate([
      { $match: { organizationId: orgId, saleDate: matchDate } },
      { $group: {
          _id: '$customer',
          totalWeight: { $sum: '$weight' },
          totalSales: { $sum: '$netAmount' },
          totalPaid: { $sum: '$paidAmount' }
      }},
      { $lookup: {
          from: 'distributorcustomers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerDetails'
      }},
      { $unwind: '$customerDetails' },
      { $project: {
          shopName: '$customerDetails.shopName',
          route: '$customerDetails.route',
          totalWeight: 1,
          totalSales: 1,
          totalPaid: 1,
          currentDue: '$customerDetails.currentDue' // Live due from DB
      }},
      { $sort: { totalSales: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          sales: salesData[0] || { totalWeight: 0, totalGross: 0, totalNet: 0, totalPaid: 0 },
          purchases: purchasesData[0] || { totalWeight: 0, totalGross: 0, totalNet: 0, totalPaid: 0 },
          collections: collectionsData[0]?.total || 0,
          expenses: expensesData[0]?.total || 0
        },
        shopPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};
