import express from 'express';
import { 
  getAllOrganizations, 
  updateOrganizationStatus,
  updateOrganizationSubscription,
  getDashboardStats
} from '../controllers/superAdminController.js';

import { 
  getBusinessAccounts, updateBusinessAccount, 
  getBusinessPartners, createBusinessPartner,
  getTeamMembers, createTeamMember
} from '../controllers/saBusinessController.js';

import { 
  getOSProducts, createOSProduct, 
  getOSPlans, createOSPlan, 
  getSubscriptions, createSubscription, updateSubscription 
} from '../controllers/saSubscriptionController.js';

import { 
  getInvoices, createInvoice, 
  getPayments, verifyPayment, createManualPayment 
} from '../controllers/saPaymentController.js';

import { getAuditLogs } from '../controllers/saAuditController.js';
import { getTemplates, createTemplate, deleteTemplate, pushTemplateToTenants } from '../controllers/saMdmController.js';
import { getTickets, createTicket, updateTicket } from '../controllers/saSupportController.js';
import { impersonateTenant } from '../controllers/authController.js';
import { getGodViewAnalytics } from '../controllers/saAnalyticsController.js';

import { protect } from '../middlewares/authMiddleware.js';
import AppError from '../utils/AppError.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';

const router = express.Router();

const restrictToSuperAdmin = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if ((!org || org.businessType !== 'SUPERADMIN') && req.user.platformRole !== 'SUPER_ADMIN') {
      return next(new AppError('Not authorized to access Super Admin routes', 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.use(protect);
router.use(restrictToSuperAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/god-view-analytics', getGodViewAnalytics);

// Organizations (Legacy)
router.get('/organizations', getAllOrganizations);
router.patch('/organizations/:id/status', updateOrganizationStatus);
router.patch('/organizations/:id/subscription', updateOrganizationSubscription);

// Business Accounts & Partners
router.get('/business-accounts', getBusinessAccounts);
router.patch('/business-accounts/:id', updateBusinessAccount);
router.get('/business-partners', getBusinessPartners);
router.post('/business-partners', createBusinessPartner);

// Team Members
router.get('/team-members', getTeamMembers);
router.post('/team-members', createTeamMember);

// OS Products & Plans
router.get('/os-products', getOSProducts);
router.post('/os-products', createOSProduct);
router.get('/os-plans', getOSPlans);
router.post('/os-plans', createOSPlan);

// Subscriptions
router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions', createSubscription);
router.patch('/subscriptions/:id', updateSubscription);

// Invoices & Payments
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.get('/payments', getPayments);
router.post('/payments', createManualPayment);
router.post('/payments/:id/verify', verifyPayment);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// Master Data Management (MDM)
router.get('/mdm/templates', getTemplates);
router.post('/mdm/templates', createTemplate);
router.delete('/mdm/templates/:id', deleteTemplate);
router.post('/mdm/templates/:id/push', pushTemplateToTenants);

// Support & Operations
router.get('/support-tickets', getTickets);
router.post('/support-tickets', createTicket);
router.patch('/support-tickets/:id', updateTicket);
router.post('/impersonate/:targetOrgId', impersonateTenant);

export default router;
