import DistributorSale from '../models/DistributorSale.js';
import DistributorPurchase from '../models/DistributorPurchase.js';
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorSupplier from '../models/DistributorSupplier.js';
import DistributorStock from '../models/DistributorStock.js';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorExpense from '../models/DistributorExpense.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Today's Sales
    const todaySalesData = await DistributorSale.aggregate([
      { $match: { organizationId: orgId, saleDate: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);
    const todaySales = todaySalesData[0]?.total || 0;

    // 2. Today's Purchases
    const todayPurchasesData = await DistributorPurchase.aggregate([
      { $match: { organizationId: orgId, purchaseDate: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todayPurchases = todayPurchasesData[0]?.total || 0;

    // 3. Today's Collections
    const todayCollectionsData = await DistributorPayment.aggregate([
      { $match: { organizationId: orgId, type: 'CUSTOMER_COLLECTION', date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayCollections = todayCollectionsData[0]?.total || 0;

    // 4. Customer Receivables
    const customerReceivableData = await DistributorCustomer.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, total: { $sum: '$currentDue' } } }
    ]);
    const customerReceivable = customerReceivableData[0]?.total || 0;

    // 5. Supplier Payables
    const supplierPayableData = await DistributorSupplier.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, total: { $sum: '$currentPayable' } } }
    ]);
    const supplierPayable = supplierPayableData[0]?.total || 0;

    // 6. Current Stock
    const stockData = await DistributorStock.findOne({ organizationId: orgId });
    const stockValue = stockData?.currentStock || 0;

    // 7. Today's Expenses
    const todayExpensesData = await DistributorExpense.aggregate([
      { $match: { organizationId: orgId, date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = todayExpensesData[0]?.total || 0;

    // Rough Profit Estimate (Today's Sales - Today's Purchases (adjusted for weight sold) - Expenses)
    // For simplicity right now, we will just send raw metrics, frontend can display it.
    // Recent Sales
    const recentSales = await DistributorSale.find({ organizationId: orgId })
      .populate('customer', 'shopName route')
      .sort('-createdAt')
      .limit(5);

    // Recent Purchases
    const recentPurchases = await DistributorPurchase.find({ organizationId: orgId })
      .populate('supplier', 'name')
      .sort('-createdAt')
      .limit(5);
    
    res.status(200).json({
      status: 'success',
      data: {
        todaySales,
        todayPurchases,
        todayCollections,
        customerReceivable,
        supplierPayable,
        stockValue,
        expenses,
        profit: todaySales - todayPurchases - expenses,
        recentSales,
        recentPurchases
      }
    });
  } catch (error) { next(error); }
};
