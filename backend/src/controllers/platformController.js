import PlatformDashboardService from '../services/PlatformDashboardService.js';
import PlatformBusinessService from '../services/PlatformBusinessService.js';
import PlatformOSProductService from '../services/PlatformOSProductService.js';
import PlatformOSPlanService from '../services/PlatformOSPlanService.js';
import PlatformSubscriptionService from '../services/PlatformSubscriptionService.js';
import PlatformFinanceService from '../services/PlatformFinanceService.js';
import PlatformAuditService from '../services/PlatformAuditService.js';
import PlatformAccessService from '../services/PlatformAccessService.js';
import PlatformSettingsService from '../services/PlatformSettingsService.js';
import PlatformMasterDataService from '../services/PlatformMasterDataService.js';
import PlatformSupportService from '../services/PlatformSupportService.js';
import PlatformNotificationService from '../services/PlatformNotificationService.js';
import PlatformPartnerService from '../services/PlatformPartnerService.js';
import PlatformCMSService from '../services/PlatformCMSService.js';
import PlatformTelemetryService from '../services/PlatformTelemetryService.js';
import AppError from '../utils/AppError.js';

export const getPlatformDashboard = async (req, res, next) => {
  try {
    const dashboardData = await PlatformDashboardService.getDashboardSummary();
    res.status(200).json({ status: 'success', data: dashboardData });
  } catch (error) { 
    next(error); 
  }
};

export const getPlatformBusinessAccounts = async (req, res, next) => {
  try {
    const data = await PlatformBusinessService.getPaginatedAccounts(req.query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getPlatformBusinessAccountDetails = async (req, res, next) => {
  try {
    const data = await PlatformBusinessService.getAccountDetails(req.params.id);
    if (!data) return next(new AppError('Account not found', 404));
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformBusinessAccount = async (req, res, next) => {
  try {
    const account = await PlatformBusinessService.createAccount(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: account });
  } catch (error) {
    if (error.message.includes('Email is already registered')) {
      return next(new AppError(error.message, 400));
    }
    next(error);
  }
};

export const updatePlatformBusinessAccount = async (req, res, next) => {
  try {
    const account = await PlatformBusinessService.updateAccountStatus(
      req.params.id, 
      req.body, 
      req.user._id, 
      req.ip, 
      req.headers['user-agent']
    );
    if (!account) return next(new AppError('Account not found', 404));
    res.status(200).json({ status: 'success', data: account });
  } catch (error) {
    next(error);
  }
};

export const verifyPlatformBusinessAccount = async (req, res, next) => {
  try {
    const result = await PlatformBusinessService.verifyAndActivateAccount(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!result) return next(new AppError('Account not found', 404));
    res.status(200).json({
      status: 'success',
      message: 'Business account verified, provisioned and activated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// OS Product Endpoints
export const getPlatformOSProducts = async (req, res, next) => {
  try {
    const data = await PlatformOSProductService.getOSProducts();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformOSProduct = async (req, res, next) => {
  try {
    const product = await PlatformOSProductService.createOSProduct(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformOSProduct = async (req, res, next) => {
  try {
    const product = await PlatformOSProductService.updateOSProduct(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!product) return next(new AppError('OS Product not found', 404));
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformOSProduct = async (req, res, next) => {
  try {
    const product = await PlatformOSProductService.deleteOSProduct(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!product) return next(new AppError('OS Product not found', 404));
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// OS Plan Endpoints
export const getPlatformOSPlans = async (req, res, next) => {
  try {
    const data = await PlatformOSPlanService.getOSPlans();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformOSPlan = async (req, res, next) => {
  try {
    const plan = await PlatformOSPlanService.createOSPlan(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformOSPlan = async (req, res, next) => {
  try {
    const plan = await PlatformOSPlanService.updateOSPlan(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!plan) return next(new AppError('OS Plan not found', 404));
    res.status(200).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformOSPlan = async (req, res, next) => {
  try {
    const plan = await PlatformOSPlanService.deleteOSPlan(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!plan) return next(new AppError('OS Plan not found', 404));
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// Subscription Endpoints
export const getPlatformSubscriptions = async (req, res, next) => {
  try {
    const data = await PlatformSubscriptionService.getPaginatedSubscriptions(req.query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformSubscription = async (req, res, next) => {
  try {
    const subscription = await PlatformSubscriptionService.createSubscription(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: subscription });
  } catch (error) {
    if (error.message === 'OS Plan not found') return next(new AppError(error.message, 404));
    next(error);
  }
};

export const updatePlatformSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await PlatformSubscriptionService.updateSubscriptionStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!subscription) return next(new AppError('Subscription not found', 404));
    res.status(200).json({ status: 'success', data: subscription });
  } catch (error) {
    next(error);
  }
};

// Finance Endpoints (Invoices & Payments)
export const getPlatformInvoices = async (req, res, next) => {
  try {
    const data = await PlatformFinanceService.getInvoices();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getPlatformImplementationFees = async (req, res, next) => {
  try {
    const fees = await PlatformFinanceService.getImplementationFees();
    res.status(200).json({ status: 'success', data: { fees } });
  } catch (error) {
    next(error);
  }
};

export const getPlatformRevenueAnalytics = async (req, res, next) => {
  try {
    const analytics = await PlatformFinanceService.getRevenueAnalytics();
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    next(error);
  }
};

export const createPlatformInvoice = async (req, res, next) => {
  try {
    const invoice = await PlatformFinanceService.createInvoice(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getPlatformPayments = async (req, res, next) => {
  try {
    const data = await PlatformFinanceService.getPayments();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformPayment = async (req, res, next) => {
  try {
    const payment = await PlatformFinanceService.createPayment(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: payment });
  } catch (error) {
    next(error);
  }
};

export const verifyPlatformPayment = async (req, res, next) => {
  try {
    const payment = await PlatformFinanceService.verifyPayment(
      req.params.id,
      req.body.status, // VERIFIED or REJECTED
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!payment) return next(new AppError('Payment not found', 404));
    res.status(200).json({ status: 'success', data: payment });
  } catch (error) {
    next(error);
  }
};

// Security & Audit Endpoints
export const getPlatformAuditLogs = async (req, res, next) => {
  try {
    const data = await PlatformAuditService.getAuditLogs(req.query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// Access Control & Team Endpoints
export const getPlatformTeamMembers = async (req, res, next) => {
  try {
    const data = await PlatformAccessService.getTeamMembers();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createPlatformTeamMember = async (req, res, next) => {
  try {
    const member = await PlatformAccessService.createTeamMember(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: member });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformTeamMemberStatus = async (req, res, next) => {
  try {
    const member = await PlatformAccessService.updateTeamMemberStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    if (!member) return next(new AppError('Team member not found', 404));
    res.status(200).json({ status: 'success', data: member });
  } catch (error) {
    next(error);
  }
};

// Platform Settings Endpoints
export const getPlatformSettings = async (req, res, next) => {
  try {
    const data = await PlatformSettingsService.getSettings();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSettings = async (req, res, next) => {
  try {
    const data = await PlatformSettingsService.updateSettings(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// Master Data Management Endpoints
export const getPlatformMasterDataTemplates = async (req, res, next) => {
  try {
    const templates = await PlatformMasterDataService.getTemplates();
    res.status(200).json({ status: 'success', data: { templates } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformMasterDataTemplate = async (req, res, next) => {
  try {
    const template = await PlatformMasterDataService.createTemplate(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformMasterDataTemplate = async (req, res, next) => {
  try {
    await PlatformMasterDataService.deleteTemplate(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const pushPlatformMasterDataTemplate = async (req, res, next) => {
  try {
    const result = await PlatformMasterDataService.pushTemplate(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
};

// Central Support Desk Endpoints
export const getPlatformSupportTickets = async (req, res, next) => {
  try {
    const tickets = await PlatformSupportService.getTickets(req.query);
    res.status(200).json({ status: 'success', data: { tickets } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformSupportTicket = async (req, res, next) => {
  try {
    const ticket = await PlatformSupportService.createTicket(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSupportTicketStatus = async (req, res, next) => {
  try {
    const ticket = await PlatformSupportService.updateTicketStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// Platform Notifications Endpoints
export const getPlatformNotifications = async (req, res, next) => {
  try {
    const notifications = await PlatformNotificationService.getNotifications();
    res.status(200).json({ status: 'success', data: { notifications } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformNotification = async (req, res, next) => {
  try {
    const notification = await PlatformNotificationService.createNotification(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: notification });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformNotification = async (req, res, next) => {
  try {
    await PlatformNotificationService.deleteNotification(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

// Partner Management Endpoints
export const getPlatformPartners = async (req, res, next) => {
  try {
    const partners = await PlatformPartnerService.getPartners();
    res.status(200).json({ status: 'success', data: { partners } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformPartner = async (req, res, next) => {
  try {
    const partner = await PlatformPartnerService.createPartner(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: partner });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformPartnerStatus = async (req, res, next) => {
  try {
    const partner = await PlatformPartnerService.updatePartnerStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: partner });
  } catch (error) {
    next(error);
  }
};

// Subscription Renewals Endpoint
export const getPlatformRenewals = async (req, res, next) => {
  try {
    const renewals = await PlatformSubscriptionService.getUpcomingRenewals();
    res.status(200).json({ status: 'success', data: { renewals } });
  } catch (error) {
    next(error);
  }
};

// CMS Endpoints
export const getPlatformCMSPages = async (req, res, next) => {
  try {
    const pages = await PlatformCMSService.getPages();
    res.status(200).json({ status: 'success', data: { pages } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSPage = async (req, res, next) => {
  try {
    const page = await PlatformCMSService.createPage(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: page });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformCMSPageStatus = async (req, res, next) => {
  try {
    const page = await PlatformCMSService.updatePageStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: page });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSPage = async (req, res, next) => {
  try {
    await PlatformCMSService.deletePage(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getPlatformCMSPosts = async (req, res, next) => {
  try {
    const posts = await PlatformCMSService.getPosts();
    res.status(200).json({ status: 'success', data: { posts } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSPost = async (req, res, next) => {
  try {
    const post = await PlatformCMSService.createPost(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformCMSPostStatus = async (req, res, next) => {
  try {
    const post = await PlatformCMSService.updatePostStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSPost = async (req, res, next) => {
  try {
    await PlatformCMSService.deletePost(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getPlatformCMSMedia = async (req, res, next) => {
  try {
    const media = await PlatformCMSService.getMedia();
    res.status(200).json({ status: 'success', data: { media } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSMedia = async (req, res, next) => {
  try {
    const media = await PlatformCMSService.createMedia(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: media });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSMedia = async (req, res, next) => {
  try {
    await PlatformCMSService.deleteMedia(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getPlatformUsage = async (req, res, next) => {
  try {
    const analytics = await PlatformTelemetryService.getUsageAnalytics();
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getPlatformDeepAnalytics = async (req, res, next) => {
  try {
    const analytics = await PlatformTelemetryService.getDeepAnalytics();
    res.status(200).json({ status: 'success', data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getPlatformOSPerformance = async (req, res, next) => {
  try {
    const performance = await PlatformTelemetryService.getOSPerformance();
    res.status(200).json({ status: 'success', data: performance });
  } catch (error) {
    next(error);
  }
};

export const getPlatformCMSMenus = async (req, res, next) => {
  try {
    const menus = await PlatformCMSService.getMenus();
    res.status(200).json({ status: 'success', data: { menus } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSMenu = async (req, res, next) => {
  try {
    const menu = await PlatformCMSService.createMenu(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: menu });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformCMSMenu = async (req, res, next) => {
  try {
    const menu = await PlatformCMSService.updateMenu(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: menu });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSMenu = async (req, res, next) => {
  try {
    await PlatformCMSService.deleteMenu(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getPlatformCMSBanners = async (req, res, next) => {
  try {
    const banners = await PlatformCMSService.getBanners();
    res.status(200).json({ status: 'success', data: { banners } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSBanner = async (req, res, next) => {
  try {
    const banner = await PlatformCMSService.createBanner(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: banner });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformCMSBanner = async (req, res, next) => {
  try {
    const banner = await PlatformCMSService.updateBanner(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: banner });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSBanner = async (req, res, next) => {
  try {
    await PlatformCMSService.deleteBanner(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getPlatformCMSLandingPages = async (req, res, next) => {
  try {
    const pages = await PlatformCMSService.getLandingPages();
    res.status(200).json({ status: 'success', data: { pages } });
  } catch (error) {
    next(error);
  }
};

export const createPlatformCMSLandingPage = async (req, res, next) => {
  try {
    const page = await PlatformCMSService.createLandingPage(
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: page });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformCMSLandingPage = async (req, res, next) => {
  try {
    const page = await PlatformCMSService.updateLandingPage(
      req.params.id,
      req.body,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json({ status: 'success', data: page });
  } catch (error) {
    next(error);
  }
};

export const deletePlatformCMSLandingPage = async (req, res, next) => {
  try {
    await PlatformCMSService.deleteLandingPage(
      req.params.id,
      req.user._id,
      req.ip,
      req.headers['user-agent']
    );
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
