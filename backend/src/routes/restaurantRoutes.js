import express from 'express';
import { protect, requireOrganization } from '../middlewares/authMiddleware.js';
import {
  getDashboardAnalytics,
  getTables,
  getCategoriesAndMenu,
  getOrders,
  createOrder,
  updateOrderStatus,
  getKdsTickets,
  updateKdsItemReady,
  bumpKdsTicket,
  settleOrderBill,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleMenuItem86,
  deleteMenuItem,
  createArea,
  updateArea,
  deleteArea,
  createTable,
  updateTable,
  updateTableStatus,
  transferTable,
  deleteTable,
  getBills,
  getBillById,
  voidBill,
  getCurrentShift,
  openShift,
  recordCashDrop,
  closeShift,
  getShiftsHistory,
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  deleteInventoryItem,
  getProcurementSummary,
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  recordGrnReceipt,
  recordVendorPayment,
  getCustomerAnalytics,
  getCustomers,
  getCustomerById,
  lookupCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getExpenseAnalytics,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getFinancialPnlReport,
  getChannelPerformanceReport,
  getDaypartAnalytics,
  getAggregatorOverview,
  simulateAggregatorOrder,
  updateRiderStatus,
  toggleAggregatorStoreStatus,
  updateAggregatorConfig,
  getReservationsAnalytics,
  getReservations,
  getAvailableTablesForReservation,
  getReservationById,
  createReservation,
  updateReservation,
  seatReservation,
  sendReservationConfirmation,
  cancelReservation,
  getStaffAnalytics,
  getStaffMembers,
  getStaffById,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getRosterSchedule,
  createRosterShift,
  updateRosterShift,
  clockInStaff,
  clockOutStaff,
  deleteRosterShift,
  getTipPoolAnalytics,
  getTipPools,
  calculateTipPool,
  disburseTipPool,
  updateTipPayoutStatus
} from '../controllers/restaurantController.js';

const router = express.Router();

// Require authenticated user and organization boundary
router.use(protect, requireOrganization);

// Dashboard
router.get('/dashboard', getDashboardAnalytics);

// Tables & Floor
router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.patch('/tables/:id/status', updateTableStatus);
router.post('/tables/transfer', transferTable);
router.delete('/tables/:id', deleteTable);

// Areas
router.post('/areas', createArea);
router.put('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);

// Menu & Categories Read
router.get('/menu', getCategoriesAndMenu);

// Category Management CRUD
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Menu Item Management CRUD
router.post('/menu', createMenuItem);
router.put('/menu/:id', updateMenuItem);
router.patch('/menu/:id/toggle-86', toggleMenuItem86);
router.delete('/menu/:id', deleteMenuItem);

// Orders & POS
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:orderId/settle', settleOrderBill);

// Kitchen Display System (KDS)
router.get('/kds', getKdsTickets);
router.patch('/kds/:orderId/items/:itemId/ready', updateKdsItemReady);
router.post('/kds/:orderId/bump', bumpKdsTicket);

// Billing, Settlement & Tax Invoices
router.get('/bills', getBills);
router.get('/bills/:id', getBillById);
router.post('/bills/:id/void', voidBill);

// Shifts, Drawer Reconciliation & Drops
router.get('/shifts/current', getCurrentShift);
router.post('/shifts/open', openShift);
router.post('/shifts/:id/drop', recordCashDrop);
router.post('/shifts/:id/close', closeShift);
router.get('/shifts', getShiftsHistory);

// Recipe Management & Ingredient Food Costing
router.get('/recipes', getRecipes);
router.get('/recipes/:id', getRecipeById);
router.post('/recipes', createRecipe);
router.put('/recipes/:id', updateRecipe);
router.delete('/recipes/:id', deleteRecipe);

// Raw Ingredient Inventory & Par-Level Tracking
router.get('/inventory', getInventoryItems);
router.get('/inventory/:id', getInventoryItemById);
router.post('/inventory', createInventoryItem);
router.put('/inventory/:id', updateInventoryItem);
router.post('/inventory/:id/adjust', adjustInventoryStock);
router.delete('/inventory/:id', deleteInventoryItem);

// Procurement, Vendors & Purchase Orders
router.get('/purchases/summary', getProcurementSummary);
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorById);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

router.get('/purchases', getPurchaseOrders);
router.get('/purchases/:id', getPurchaseOrderById);
router.post('/purchases', createPurchaseOrder);
router.patch('/purchases/:id/status', updatePurchaseOrderStatus);
router.post('/purchases/:id/grn', recordGrnReceipt);
router.post('/purchases/:id/pay', recordVendorPayment);

// Customer CRM, Guest Directory & Loyalty
router.get('/customers/analytics', getCustomerAnalytics);
router.get('/customers/lookup', lookupCustomerByPhone);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Operating Expenses & Kitchen Overheads
router.get('/expenses/analytics', getExpenseAnalytics);
router.get('/expenses', getExpenses);
router.get('/expenses/:id', getExpenseById);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Financial Reports, Profit & Loss (P&L) & Channel Analytics
router.get('/reports/pnl', getFinancialPnlReport);
router.get('/reports/channels', getChannelPerformanceReport);
router.get('/reports/dayparts', getDaypartAnalytics);

// Online Delivery Aggregators & Webhook Simulation
router.get('/aggregators', getAggregatorOverview);
router.post('/aggregators/simulate', simulateAggregatorOrder);
router.patch('/aggregators/rider/:orderId', updateRiderStatus);
router.post('/aggregators/toggle', toggleAggregatorStoreStatus);
router.put('/aggregators/config', updateAggregatorConfig);

// Table Reservations & Advance Guest Bookings
router.get('/reservations/analytics', getReservationsAnalytics);
router.get('/reservations/available-tables', getAvailableTablesForReservation);
router.get('/reservations', getReservations);
router.get('/reservations/:id', getReservationById);
router.post('/reservations', createReservation);
router.put('/reservations/:id', updateReservation);
router.post('/reservations/:id/seat', seatReservation);
router.post('/reservations/:id/send-confirmation', sendReservationConfirmation);
router.delete('/reservations/:id', cancelReservation);

// Staff Directory, Rostering & Tips Pool
router.get('/staff/analytics', getStaffAnalytics);
router.get('/staff', getStaffMembers);
router.get('/staff/:id', getStaffById);
router.post('/staff', createStaffMember);
router.put('/staff/:id', updateStaffMember);
router.delete('/staff/:id', deleteStaffMember);

// Staff Shift Rostering & Attendance
router.get('/staff-roster', getRosterSchedule);
router.post('/staff-roster', createRosterShift);
router.put('/staff-roster/:id', updateRosterShift);
router.post('/staff-roster/:id/clock-in', clockInStaff);
router.post('/staff-roster/:id/clock-out', clockOutStaff);
router.delete('/staff-roster/:id', deleteRosterShift);

// Gratuity & Tips Pool Distribution
router.get('/staff-tips/analytics', getTipPoolAnalytics);
router.get('/staff-tips', getTipPools);
router.post('/staff-tips/calculate', calculateTipPool);
router.post('/staff-tips/:id/disburse', disburseTipPool);
router.patch('/staff-tips/:id/payout/:payoutId', updateTipPayoutStatus);

export default router;
