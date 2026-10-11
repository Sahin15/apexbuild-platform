import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import boqRoutes from './routes/boqRoutes.js';
import siteReportRoutes from './routes/siteReportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import labourRoutes from './routes/labourRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import snagRoutes from './routes/snagRoutes.js';
import pettyCashRoutes from './routes/pettyCashRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import tenantSupportRoutes from './routes/tenantSupportRoutes.js';

// Supplier Routes
import supplierCustomerRoutes from './routes/supplierCustomerRoutes.js';
import supplierVendorRoutes from './routes/supplierVendorRoutes.js';
import supplierProductRoutes from './routes/supplierProductRoutes.js';
import supplierPurchaseRoutes from './routes/supplierPurchaseRoutes.js';
import supplierInventoryRoutes from './routes/supplierInventoryRoutes.js';
import supplierOrderRoutes from './routes/supplierOrderRoutes.js';
import supplierDeliveryRoutes from './routes/supplierDeliveryRoutes.js';
import supplierQuotationRoutes from './routes/supplierQuotationRoutes.js';
import supplierInvoiceRoutes from './routes/supplierInvoiceRoutes.js';
import supplierPaymentRoutes from './routes/supplierPaymentRoutes.js';
import supplierExpenseRoutes from './routes/supplierExpenseRoutes.js';
import supplierReportRoutes from './routes/supplierReportRoutes.js';
import supplierDocumentRoutes from './routes/supplierDocumentRoutes.js';
import supplierDashboardRoutes from './routes/supplierDashboardRoutes.js';
import supplierLogisticsRoutes from './routes/supplierLogisticsRoutes.js';

// Distributor Routes
import distributorRoutes from './routes/distributorRoutes.js';

// Diagnostics Routes
import diagnosticsRoutes from './routes/diagnosticsRoutes.js';

// Push Notifications Routes
import pushNotificationRoutes from './routes/pushNotificationRoutes.js';

// Firebase Cloud Messaging Routes
import fcmRoutes from './routes/fcmRoutes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/platform', platformRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/boq', boqRoutes);
app.use('/api/v1/projects/:projectId/boq', boqRoutes); // Support nested routing for project BOQ
app.use('/api/v1/site-reports', siteReportRoutes);
app.use('/api/v1/projects/:projectId/site-reports', siteReportRoutes); // Support nested routing
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects/:projectId/tasks', taskRoutes); // Support nested routing for project tasks
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/projects/:projectId/documents', documentRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/projects/:projectId/materials', materialRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/projects/:projectId/expenses', expenseRoutes);
app.use('/api/v1/labour', labourRoutes);
app.use('/api/v1/projects/:projectId/labour', labourRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/projects/:projectId/billing', billingRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/projects/:projectId/equipment', equipmentRoutes);
app.use('/api/v1/snags', snagRoutes);
app.use('/api/v1/projects/:projectId/snags', snagRoutes);
app.use('/api/v1/petty-cash', pettyCashRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/support', tenantSupportRoutes);

// Supplier Endpoints
app.use('/api/v1/supplier/customers', supplierCustomerRoutes);
app.use('/api/v1/supplier/vendors', supplierVendorRoutes);
app.use('/api/v1/supplier/products', supplierProductRoutes);
app.use('/api/v1/supplier/purchases', supplierPurchaseRoutes);
app.use('/api/v1/supplier/inventory', supplierInventoryRoutes);
app.use('/api/v1/supplier/quotations', supplierQuotationRoutes);
app.use('/api/v1/supplier/orders', supplierOrderRoutes);
app.use('/api/v1/supplier/deliveries', supplierDeliveryRoutes);
app.use('/api/v1/supplier/invoices', supplierInvoiceRoutes);
app.use('/api/v1/supplier/payments', supplierPaymentRoutes);
app.use('/api/v1/supplier/expenses', supplierExpenseRoutes);
app.use('/api/v1/supplier/reports', supplierReportRoutes);
app.use('/api/v1/supplier/documents', supplierDocumentRoutes);
app.use('/api/v1/supplier/dashboard', supplierDashboardRoutes);
app.use('/api/v1/supplier/logistics', supplierLogisticsRoutes);

// Distributor Endpoints
app.use('/api/v1/distributor', distributorRoutes);

// Diagnostics Endpoints
app.use('/api/v1/diagnostics', diagnosticsRoutes);

// Push Notifications Endpoints
app.use('/api/v1/notifications', pushNotificationRoutes);
app.use('/api/v1/fcm', fcmRoutes);

// Health Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ApexBuild API is running',
    database: mongoose.connection.name,
    dbConnected: mongoose.connection.readyState === 1
  });
});

// 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
