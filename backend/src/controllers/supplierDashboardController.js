import SupplierOrder from '../models/SupplierOrder.js';
import SupplierPurchase from '../models/SupplierPurchase.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import SupplierVendor from '../models/SupplierVendor.js';
import SupplierProduct from '../models/SupplierProduct.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;

    // Today boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sales
    const salesAgg = await SupplierOrder.aggregate([
      { $match: { organizationId: orgId, orderDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalCollections: { $sum: '$paidAmount' } } }
    ]);
    const todaySales = salesAgg[0]?.totalSales || 0;
    const todayCollections = salesAgg[0]?.totalCollections || 0;

    // 2. Today's Purchases
    const purchasesAgg = await SupplierPurchase.aggregate([
      { $match: { organizationId: orgId, purchaseDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, totalPurchases: { $sum: '$grandTotal' } } }
    ]);
    const todayPurchases = purchasesAgg[0]?.totalPurchases || 0;

    // 3. Customer Receivable (Total Due)
    const customerAgg = await SupplierCustomer.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalReceivable: { $sum: '$currentDue' } } }
    ]);
    const customerReceivable = customerAgg[0]?.totalReceivable || 0;

    // 4. Supplier Payable (Total Payable)
    const vendorAgg = await SupplierVendor.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalPayable: { $sum: '$currentPayable' } } }
    ]);
    const supplierPayable = vendorAgg[0]?.totalPayable || 0;

    // 5. Stock Value
    const stockAgg = await SupplierProduct.aggregate([
      { $match: { organizationId: orgId } },
      { $project: { stockValue: { $multiply: ['$currentStock', '$purchasePrice'] } } },
      { $group: { _id: null, totalStockValue: { $sum: '$stockValue' } } }
    ]);
    const stockValue = stockAgg[0]?.totalStockValue || 0;

    // 6. Low Stock Alerts
    const lowStockItems = await SupplierProduct.find({
      organizationId: orgId,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    }).select('name currentStock minStockLevel unit').limit(5);

    // 7. Outstanding Customer Dues
    const outstandingDues = await SupplierCustomer.find({
      organizationId: orgId,
      currentDue: { $gt: 0 }
    }).select('name currentDue phone').sort('-currentDue').limit(5);

    // 8. Recent Orders
    const recentOrders = await SupplierOrder.find({
      organizationId: orgId
    }).select('orderNumber customer grandTotal status orderDate')
      .populate('customer', 'name')
      .sort('-createdAt').limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          todaySales,
          todayPurchases,
          todayCollections,
          customerReceivable,
          supplierPayable,
          stockValue
        },
        lowStockItems,
        outstandingDues,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};
