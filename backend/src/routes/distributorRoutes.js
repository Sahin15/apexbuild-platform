import express from 'express';
import distributorSupplierRoutes from './distributorSupplierRoutes.js';
import distributorCustomerRoutes from './distributorCustomerRoutes.js';
import distributorPurchaseRoutes from './distributorPurchaseRoutes.js';
import distributorSaleRoutes from './distributorSaleRoutes.js';
import distributorStockRoutes from './distributorStockRoutes.js';
import distributorDashboardRoutes from './distributorDashboardRoutes.js';
import distributorExpenseRoutes from './distributorExpenseRoutes.js';
import distributorPaymentRoutes from './distributorPaymentRoutes.js';
import distributorEstimationRoutes from './distributorEstimationRoutes.js';
import distributorReportRoutes from './distributorReportRoutes.js';
import distributorVehicleRoutes from './distributorVehicleRoutes.js';
import distributorTripRoutes from './distributorTripRoutes.js';

const router = express.Router();

router.use('/suppliers', distributorSupplierRoutes);
router.use('/customers', distributorCustomerRoutes);
router.use('/purchases', distributorPurchaseRoutes);
router.use('/sales', distributorSaleRoutes);
router.use('/stock', distributorStockRoutes);
router.use('/dashboard', distributorDashboardRoutes);
router.use('/expenses', distributorExpenseRoutes);
router.use('/payments', distributorPaymentRoutes);
router.use('/estimations', distributorEstimationRoutes);
router.use('/reports', distributorReportRoutes);
router.use('/vehicles', distributorVehicleRoutes);
router.use('/trips', distributorTripRoutes);

export default router;
