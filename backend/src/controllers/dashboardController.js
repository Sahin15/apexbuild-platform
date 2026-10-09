import Project from '../models/Project.js';
import SiteReport from '../models/SiteReport.js';
import { calculateProjectFinancials } from '../services/financialService.js';
import AppError from '../utils/AppError.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { range } = req.query; // 'Today', 'This Week', 'This Month'

    let startDate = null;
    let endDate = null;
    const now = new Date();

    if (range === 'Today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (range === 'This Week') {
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(new Date(now).setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const totalProjects = await Project.countDocuments({ organizationId: orgId });
    const activeProjects = await Project.countDocuments({ organizationId: orgId, status: 'ACTIVE' });

    // In a real app, this would be an aggregation pipeline across all projects, 
    // but for simplicity we will calculate it here by mapping over active projects
    const allProjects = await Project.find({ organizationId: orgId });
    
    let totalContractValue = 0;
    let totalExpenses = 0;
    let totalBilled = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let expectedProfit = 0;

    // A real implementation should use Mongoose aggregation for performance, 
    // but this leverages our service for consistency as requested.
    for (const project of allProjects) {
      const financials = await calculateProjectFinancials(project._id, orgId, startDate, endDate);
      totalContractValue += financials.contractValue;
      totalExpenses += financials.actualCost;
      totalBilled += financials.billedAmount;
      totalReceived += financials.receivedAmount;
      totalOutstanding += financials.outstandingAmount;
      expectedProfit += financials.expectedProfit;
    }

    const recentSiteReports = await SiteReport.find({ organizationId: orgId })
      .populate('siteEngineerId', 'name')
      .populate('projectId', 'name')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalProjects,
          activeProjects,
          totalContractValue,
          totalExpenses,
          totalBilled,
          totalReceived,
          totalOutstanding,
          totalPayable: 0, // Requires expense/vendor aggregations
          expectedProfit
        },
        recentSiteReports,
        pendingApprovals: [], // Requires aggregation of draft/submitted reports, bills, measurements
        alerts: [] // Custom logic for alerts
      }
    });
  } catch (error) {
    next(error);
  }
};
