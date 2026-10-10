import Project from '../models/Project.js';
import Expense from '../models/Expense.js';
import RABill from '../models/RABill.js';
import BOQItem from '../models/BOQItem.js';
import Measurement from '../models/Measurement.js';
import { calculateProjectFinancials } from '../services/financialService.js';

export const getProjectCostReport = async (req, res, next) => {
  try {
    const projects = await Project.find({ organizationId: req.user.organizationId })
      .select('name projectCode contractValue status location startDate expectedEndDate');
      
    const reportData = await Promise.all(projects.map(async (project) => {
      const expenses = await Expense.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]);
      
      let materialCost = 0;
      let labourCost = 0;
      let otherCost = 0;
      
      expenses.forEach(e => {
        if (e._id === 'Material') materialCost += e.total;
        else if (e._id === 'Labour') labourCost += e.total;
        else otherCost += e.total;
      });

      return {
        'Project Name': project.name,
        'Project Code': project.projectCode,
        'Status': project.status,
        'Contract Value': project.contractValue || 0,
        'Material Cost': materialCost,
        'Labour Cost': labourCost,
        'Other Expenses': otherCost,
        'Total Cost': materialCost + labourCost + otherCost
      };
    }));

    res.status(200).json({ status: 'success', data: { report: reportData } });
  } catch (error) {
    next(error);
  }
};

export const getRABillingSummary = async (req, res, next) => {
  try {
    const bills = await RABill.find({ organizationId: req.user.organizationId })
      .populate('projectId', 'name projectCode')
      .sort('-billDate');

    const reportData = bills.map(bill => ({
      'Project': bill.projectId?.name || 'Unknown',
      'Bill No': bill.billNumber,
      'Bill Date': new Date(bill.billDate).toLocaleDateString(),
      'Status': bill.status,
      'Work Value': bill.workValue,
      'Material Adv': bill.materialAdvance,
      'Mobilization Adv': bill.mobilizationAdvance,
      'Retention Amount': bill.retentionAmount,
      'TDS Amount': bill.tdsAmount,
      'Other Deductions': bill.otherDeductions,
      'Net Payable': bill.netPayable
    }));

    res.status(200).json({ status: 'success', data: { report: reportData } });
  } catch (error) {
    next(error);
  }
};

import GoodsReceivedNote from '../models/GoodsReceivedNote.js';
import LabourWageSheet from '../models/LabourWageSheet.js';
import EquipmentLog from '../models/EquipmentLog.js';

export const getProfitabilityReport = async (req, res, next) => {
  try {
    const projects = await Project.find({ organizationId: req.user.organizationId });
    
    const reportData = await Promise.all(projects.map(async (project) => {
      const financials = await calculateProjectFinancials(project._id, req.user.organizationId);
      
      const profit = financials.totalBilled - financials.totalExpenses;
      const margin = financials.totalBilled > 0 ? ((profit / financials.totalBilled) * 100).toFixed(2) + '%' : '0%';

      return {
        'Project Name': project.name,
        'Contract Value': project.contractValue || 0,
        'Total Billed': financials.totalBilled,
        'Total Expenses': financials.totalExpenses,
        'Gross Profit': profit,
        'Profit Margin': margin
      };
    }));

    res.status(200).json({ status: 'success', data: { report: reportData } });
  } catch (error) {
    next(error);
  }
};

/**
 * Real-Time Project Cash Flow & P&L Snapshot
 * Computes exact Money In (RA Bills Certified & Received) vs Money Out (Materials GRN, Labour Wages, Site Expenses)
 */
export const getCashFlowAndPnLSnapshot = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user.organizationId;

    let projectFilter = { organizationId };
    if (projectId && projectId !== 'ALL') {
      projectFilter._id = projectId;
    }

    const projects = await Project.find(projectFilter).select('name projectCode contractValue estimatedCost status client startDate expectedEndDate');

    // Aggregate metrics for each project
    const projectSnapshots = await Promise.all(projects.map(async (prj) => {
      // 1. RA Bills & Revenue
      const bills = await RABill.find({ projectId: prj._id, organizationId });
      
      const totalGrossWorkDone = bills.reduce((sum, b) => sum + (b.grossCurrentAmount || b.grossAmount || 0), 0);
      const totalNetBilled = bills.reduce((sum, b) => sum + (b.netPayable || 0), 0);
      const totalReceived = bills.reduce((sum, b) => {
        if (b.status === 'PAID') return sum + (b.netPayable || 0);
        return sum + (b.paidAmount || 0);
      }, 0);
      const totalRetention = bills.reduce((sum, b) => sum + (b.retentionAmount || 0), 0);
      const pendingReceivable = Math.max(0, totalNetBilled - totalReceived);

      // 2. Material Costs (GRNs + Material Expenses)
      const grns = await GoodsReceivedNote.find({ projectId: prj._id, organizationId, status: { $ne: 'REJECTED' } });
      const grnCost = grns.reduce((sum, g) => sum + (g.totalAmount || 0), 0);

      const matExpenses = await Expense.find({ projectId: prj._id, organizationId, category: 'Material', status: { $ne: 'Rejected' } });
      const directMatCost = matExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalMaterialCost = grnCost + directMatCost;

      // 3. Labour Costs (Wage Sheets + Labour Expenses)
      const wageSheets = await LabourWageSheet.find({ projectId: prj._id, organizationId });
      const wageCost = wageSheets.reduce((sum, w) => sum + (w.totalGrossWage || w.totalNetPayable || 0), 0);
      const disbursedWageCost = wageSheets.filter(w => w.status === 'DISBURSED').reduce((sum, w) => sum + (w.totalNetPayable || 0), 0);

      const labourExpenses = await Expense.find({ projectId: prj._id, organizationId, category: 'Labour', status: { $ne: 'Rejected' } });
      const directLabourCost = labourExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalLabourCost = wageCost + directLabourCost;

      // 4. Equipment, Transport & Plant
      const equipLogs = await EquipmentLog.find({ projectId: prj._id, organizationId });
      const equipLogCost = equipLogs.reduce((sum, l) => sum + (l.totalDayCost || 0), 0);

      const equipExpenses = await Expense.find({ 
        projectId: prj._id, 
        organizationId, 
        category: { $in: ['Equipment', 'Transport'] },
        status: { $ne: 'Rejected' } 
      });
      const totalEquipmentCost = equipLogCost + equipExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // 5. Site Overhead & Office
      const overheadExpenses = await Expense.find({ 
        projectId: prj._id, 
        organizationId, 
        category: { $in: ['Office', 'Other'] },
        status: { $ne: 'Rejected' } 
      });
      const totalOverheadCost = overheadExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // 6. Total Outflow & Net Profit
      const totalCost = totalMaterialCost + totalLabourCost + totalEquipmentCost + totalOverheadCost;
      const netProfit = totalGrossWorkDone - totalCost;
      const profitMargin = totalGrossWorkDone > 0 ? Number(((netProfit / totalGrossWorkDone) * 100).toFixed(1)) : 0;

      // 7. Cash Flow (Real Bank Liquidity)
      const cashInflow = totalReceived;
      const cashOutflow = disbursedWageCost + totalMaterialCost + totalEquipmentCost + totalOverheadCost + directLabourCost;
      const netCashFlow = cashInflow - cashOutflow;

      return {
        projectId: prj._id,
        projectName: prj.name,
        projectCode: prj.projectCode,
        contractValue: prj.contractValue || 0,
        status: prj.status,
        
        // Revenue
        totalGrossWorkDone,
        totalNetBilled,
        totalReceived,
        pendingReceivable,
        totalRetention,
        
        // Cost Breakdown
        totalMaterialCost,
        totalLabourCost,
        totalEquipmentCost,
        totalOverheadCost,
        totalCost,
        
        // Profitability
        netProfit,
        profitMargin,
        
        // Cash Flow
        cashInflow,
        cashOutflow,
        netCashFlow
      };
    }));

    // Aggregate Portfolio totals
    const portfolioSummary = projectSnapshots.reduce((acc, p) => {
      acc.totalContractValue += p.contractValue;
      acc.totalGrossWorkDone += p.totalGrossWorkDone;
      acc.totalNetBilled += p.totalNetBilled;
      acc.totalReceived += p.totalReceived;
      acc.pendingReceivable += p.pendingReceivable;
      acc.totalRetention += p.totalRetention;

      acc.totalMaterialCost += p.totalMaterialCost;
      acc.totalLabourCost += p.totalLabourCost;
      acc.totalEquipmentCost += p.totalEquipmentCost;
      acc.totalOverheadCost += p.totalOverheadCost;
      acc.totalCost += p.totalCost;

      acc.totalNetProfit += p.netProfit;
      acc.totalCashInflow += p.cashInflow;
      acc.totalCashOutflow += p.cashOutflow;
      acc.totalNetCashFlow += p.netCashFlow;
      return acc;
    }, {
      totalContractValue: 0,
      totalGrossWorkDone: 0,
      totalNetBilled: 0,
      totalReceived: 0,
      pendingReceivable: 0,
      totalRetention: 0,
      totalMaterialCost: 0,
      totalLabourCost: 0,
      totalEquipmentCost: 0,
      totalOverheadCost: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalCashInflow: 0,
      totalCashOutflow: 0,
      totalNetCashFlow: 0
    });

    portfolioSummary.portfolioMargin = portfolioSummary.totalGrossWorkDone > 0 
      ? Number(((portfolioSummary.totalNetProfit / portfolioSummary.totalGrossWorkDone) * 100).toFixed(1))
      : 0;

    // Monthly Cash Flow Trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      // Inflow in month
      const monthBills = await RABill.find({
        organizationId,
        ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
        billDate: { $gte: monthStart, $lte: monthEnd }
      });
      const inAmount = monthBills.reduce((s, b) => s + (b.grossCurrentAmount || b.grossAmount || 0), 0);

      // Outflows in month
      const monthGrns = await GoodsReceivedNote.find({
        organizationId,
        ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
        receivedDate: { $gte: monthStart, $lte: monthEnd },
        status: { $ne: 'REJECTED' }
      });
      const grnSum = monthGrns.reduce((s, g) => s + (g.totalAmount || 0), 0);

      const monthWages = await LabourWageSheet.find({
        organizationId,
        ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
        startDate: { $gte: monthStart, $lte: monthEnd }
      });
      const wageSum = monthWages.reduce((s, w) => s + (w.totalGrossWage || 0), 0);

      const monthExp = await Expense.find({
        organizationId,
        ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
        date: { $gte: monthStart, $lte: monthEnd },
        status: { $ne: 'Rejected' }
      });
      const expSum = monthExp.reduce((s, e) => s + (e.amount || 0), 0);

      const monthEquipLogs = await EquipmentLog.find({
        organizationId,
        ...(projectId && projectId !== 'ALL' ? { projectId } : {}),
        logDate: { $gte: monthStart, $lte: monthEnd }
      });
      const equipSum = monthEquipLogs.reduce((s, l) => s + (l.totalDayCost || 0), 0);

      const outAmount = grnSum + wageSum + expSum + equipSum;

      monthlyTrend.push({
        month: monthLabel,
        inflow: inAmount,
        outflow: outAmount,
        net: inAmount - outAmount
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: portfolioSummary,
        projects: projectSnapshots,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};
