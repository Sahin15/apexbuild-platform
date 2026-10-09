import Project from '../models/Project.js';
import BOQ from '../models/BOQ.js';
import RABill from '../models/RABill.js';
import Expense from '../models/Expense.js';
import BOQItem from '../models/BOQItem.js';
export const calculateProjectFinancials = async (projectId, organizationId, startDate, endDate) => {
  // Fetch Project
  const project = await Project.findOne({ _id: projectId, organizationId });
  if (!project) throw new Error('Project not found');

  // Fetch BOQ
  const boq = await BOQ.findOne({ projectId, organizationId }).sort('-createdAt');
  const estimatedCost = boq ? boq.totalAmount : project.estimatedCost;

  // Fetch RA Bills to calculate billed and received amounts
  let billQuery = { projectId, organizationId };
  if (startDate && endDate) {
    billQuery.createdAt = { $gte: startDate, $lte: endDate };
  }
  const bills = await RABill.find(billQuery);
  const totalBilled = bills.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalReceived = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.netPayable, 0);
  
  // Calculate Actual Cost (Expenses)
  let expQuery = { projectId, organizationId };
  if (startDate && endDate) {
    expQuery.date = { $gte: startDate, $lte: endDate }; // assuming Expense has a date field
  }
  const expenses = await Expense.find(expQuery);
  const actualCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate Progress (Completed vs Total BOQ Amount)
  const boqItems = boq ? await BOQItem.find({ boqId: boq._id }) : [];
  let completedAmount = 0;
  let totalAmount = boq ? boq.totalAmount : 0;
  
  if (boqItems.length > 0) {
    completedAmount = boqItems.reduce((sum, item) => sum + (item.completedQuantity * item.rate), 0);
  }
  
  const progressPercentage = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;
  
  const outstandingAmount = totalBilled - totalReceived;
  const remainingEstimatedCost = Math.max(estimatedCost - actualCost, 0);
  const forecastFinalCost = actualCost + remainingEstimatedCost;
  
  const expectedProfit = project.contractValue - forecastFinalCost;
  const expectedMargin = project.contractValue > 0 ? (expectedProfit / project.contractValue) * 100 : 0;
  
  const variance = estimatedCost - forecastFinalCost;

  return {
    contractValue: project.contractValue,
    estimatedCost,
    actualCost,
    remainingEstimatedCost,
    forecastFinalCost,
    expectedProfit,
    expectedMargin,
    billedAmount: totalBilled,
    receivedAmount: totalReceived,
    outstandingAmount,
    variance,
    progressPercentage
  };
};
