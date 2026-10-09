import SupplierOrder from '../models/SupplierOrder.js';
import SupplierExpense from '../models/SupplierExpense.js';
import SupplierProduct from '../models/SupplierProduct.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import SupplierVendor from '../models/SupplierVendor.js';
import AppError from '../utils/AppError.js';

export const getFinancialSummary = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;

    // 1. Total Sales / Revenue (from Orders)
    const sales = await SupplierOrder.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalPaid: { $sum: '$paidAmount' } } }
    ]);

    // 2. Total Expenses
    const expenses = await SupplierExpense.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalExpense: { $sum: '$amount' } } }
    ]);

    // 3. Current Inventory Valuation (Cost Price * Current Stock)
    const inventory = await SupplierProduct.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$costPrice', '$currentStock'] } } } }
    ]);

    // 4. Receivables (Customers owing money)
    const receivables = await SupplierCustomer.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalDue: { $sum: '$currentDue' } } }
    ]);

    // 5. Payables (Owed to Vendors)
    const payables = await SupplierVendor.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, totalPayable: { $sum: '$currentPayable' } } }
    ]);

    const totalRevenue = sales[0]?.totalRevenue || 0;
    const totalExpense = expenses[0]?.totalExpense || 0;
    const grossProfit = totalRevenue - totalExpense; // Note: For a true PnL, COGS should be used instead of total purchases. This is a simplified cash flow view.

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        totalPaidRevenue: sales[0]?.totalPaid || 0,
        totalExpense,
        grossProfit,
        inventoryValue: inventory[0]?.totalValue || 0,
        totalReceivables: receivables[0]?.totalDue || 0,
        totalPayables: payables[0]?.totalPayable || 0
      }
    });
  } catch (error) { next(error); }
};
