import express from 'express';
import { 
  getPlatformDashboard, 
  getPlatformBusinessAccounts, 
  getPlatformBusinessAccountDetails, 
  createPlatformBusinessAccount,
  updatePlatformBusinessAccount,
  verifyPlatformBusinessAccount,
  getPlatformTenancyWorkspaces,
  getPlatformTenancyAudit,
  getPlatformOSProducts,
  createPlatformOSProduct,
  updatePlatformOSProduct,
  deletePlatformOSProduct,
  getPlatformOSPlans,
  createPlatformOSPlan,
  updatePlatformOSPlan,
  deletePlatformOSPlan,
  getPlatformSubscriptions,
  createPlatformSubscription,
  updatePlatformSubscriptionStatus,
  updatePlatformSubscription,
  getPlatformInvoices,
  getPlatformInvoiceDetails,
  updatePlatformInvoiceStatus,
  getPlatformImplementationFees,
  getPlatformRevenueAnalytics,
  createPlatformInvoice,
  getPlatformPayments,
  createPlatformPayment,
  verifyPlatformPayment,
  getPlatformAuditLogs,
  getPlatformTeamMembers,
  createPlatformTeamMember,
  updatePlatformTeamMemberStatus,
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformMasterDataTemplates,
  createPlatformMasterDataTemplate,
  deletePlatformMasterDataTemplate,
  pushPlatformMasterDataTemplate,
  getPlatformSupportTickets,
  createPlatformSupportTicket,
  updatePlatformSupportTicketStatus,
  getPlatformNotifications,
  createPlatformNotification,
  deletePlatformNotification,
  getPlatformPartners,
  createPlatformPartner,
  updatePlatformPartnerStatus,
  getPlatformRenewals,
  getPlatformCMSPages,
  createPlatformCMSPage,
  updatePlatformCMSPageStatus,
  deletePlatformCMSPage,
  getPlatformCMSPosts,
  createPlatformCMSPost,
  updatePlatformCMSPostStatus,
  deletePlatformCMSPost,
  getPlatformCMSMedia,
  createPlatformCMSMedia,
  deletePlatformCMSMedia,
  getPlatformUsage,
  getPlatformDeepAnalytics,
  getPlatformOSPerformance,
  getPlatformCMSMenus,
  createPlatformCMSMenu,
  updatePlatformCMSMenu,
  deletePlatformCMSMenu,
  getPlatformCMSBanners,
  createPlatformCMSBanner,
  updatePlatformCMSBanner,
  deletePlatformCMSBanner,
  getPlatformCMSLandingPages,
  createPlatformCMSLandingPage,
  updatePlatformCMSLandingPage,
  deletePlatformCMSLandingPage
} from '../controllers/platformController.js';
import { protect } from '../middlewares/authMiddleware.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

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

// Dashboard Aggregation endpoint
router.get('/dashboard', getPlatformDashboard);

// Business Accounts endpoints
router.get('/business-accounts', getPlatformBusinessAccounts);
router.post('/business-accounts', createPlatformBusinessAccount);
router.get('/business-accounts/:id', getPlatformBusinessAccountDetails);
router.patch('/business-accounts/:id', updatePlatformBusinessAccount);
router.post('/business-accounts/:id/verify', verifyPlatformBusinessAccount);
router.patch('/business-accounts/:id/verify', verifyPlatformBusinessAccount);

// Tenancy Workspace Isolation & Audit Endpoints
router.get('/tenancy-workspaces', getPlatformTenancyWorkspaces);
router.get('/tenancy-audit', getPlatformTenancyAudit);

// OS Products endpoints
router.get('/os-products', getPlatformOSProducts);
router.post('/os-products', createPlatformOSProduct);
router.patch('/os-products/:id', updatePlatformOSProduct);
router.delete('/os-products/:id', deletePlatformOSProduct);

// OS Plans endpoints
router.get('/os-plans', getPlatformOSPlans);
router.post('/os-plans', createPlatformOSPlan);
router.patch('/os-plans/:id', updatePlatformOSPlan);
router.delete('/os-plans/:id', deletePlatformOSPlan);

// Subscription endpoints
router.get('/subscriptions', getPlatformSubscriptions);
router.post('/subscriptions', createPlatformSubscription);
router.patch('/subscriptions/:id/status', updatePlatformSubscriptionStatus);
router.patch('/subscriptions/:id', updatePlatformSubscription);

// Finance (Invoices & Payments) endpoints
router.get('/invoices', getPlatformInvoices);
router.get('/invoices/:id', getPlatformInvoiceDetails);
router.patch('/invoices/:id/status', updatePlatformInvoiceStatus);
router.get('/implementation-fees', getPlatformImplementationFees);
router.get('/revenue-analytics', getPlatformRevenueAnalytics);
router.post('/invoices', createPlatformInvoice);

router.get('/payments', getPlatformPayments);
router.post('/payments', createPlatformPayment);
router.post('/payments/:id/verify', verifyPlatformPayment);

// Security & Audit endpoints
router.get('/audit-logs', getPlatformAuditLogs);

// Access Control & Team endpoints
router.get('/team-members', getPlatformTeamMembers);
router.post('/team-members', createPlatformTeamMember);
router.patch('/team-members/:id/status', updatePlatformTeamMemberStatus);

// Platform Settings endpoints
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSettings);

// Master Data Management endpoints
router.get('/mdm/templates', getPlatformMasterDataTemplates);
router.post('/mdm/templates', createPlatformMasterDataTemplate);
router.delete('/mdm/templates/:id', deletePlatformMasterDataTemplate);
router.post('/mdm/templates/:id/push', pushPlatformMasterDataTemplate);

// Support Desk endpoints
router.get('/support-tickets', getPlatformSupportTickets);
router.post('/support-tickets', createPlatformSupportTicket);
router.patch('/support-tickets/:id/status', updatePlatformSupportTicketStatus);

// Notifications endpoints
router.get('/notifications', getPlatformNotifications);
router.post('/notifications', createPlatformNotification);
router.delete('/notifications/:id', deletePlatformNotification);

// Partner Management endpoints
router.get('/partners', getPlatformPartners);
router.post('/partners', createPlatformPartner);
router.patch('/partners/:id/status', updatePlatformPartnerStatus);

// Subscription Renewals endpoints
router.get('/renewals', getPlatformRenewals);

// Usage & Analytics Telemetry
router.get('/usage', getPlatformUsage);
router.get('/deep-analytics', getPlatformDeepAnalytics);
router.get('/os-performance', getPlatformOSPerformance);

// CMS endpoints
router.get('/cms/pages', getPlatformCMSPages);
router.post('/cms/pages', createPlatformCMSPage);
router.patch('/cms/pages/:id/status', updatePlatformCMSPageStatus);
router.delete('/cms/pages/:id', deletePlatformCMSPage);

router.get('/cms/blog', getPlatformCMSPosts);
router.post('/cms/blog', createPlatformCMSPost);
router.patch('/cms/blog/:id/status', updatePlatformCMSPostStatus);
router.delete('/cms/blog/:id', deletePlatformCMSPost);

router.get('/cms/media', getPlatformCMSMedia);
router.post('/cms/media', createPlatformCMSMedia);
router.delete('/cms/media/:id', deletePlatformCMSMedia);

router.get('/cms/menus', getPlatformCMSMenus);
router.post('/cms/menus', createPlatformCMSMenu);
router.patch('/cms/menus/:id', updatePlatformCMSMenu);
router.delete('/cms/menus/:id', deletePlatformCMSMenu);

router.get('/cms/banners', getPlatformCMSBanners);
router.post('/cms/banners', createPlatformCMSBanner);
router.patch('/cms/banners/:id', updatePlatformCMSBanner);
router.delete('/cms/banners/:id', deletePlatformCMSBanner);

router.get('/cms/landing-pages', getPlatformCMSLandingPages);
router.post('/cms/landing-pages', createPlatformCMSLandingPage);
router.patch('/cms/landing-pages/:id', updatePlatformCMSLandingPage);
router.delete('/cms/landing-pages/:id', deletePlatformCMSLandingPage);

export default router;
