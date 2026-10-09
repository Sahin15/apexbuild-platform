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
