import DistributorCustomer from '../models/DistributorCustomer.js';

export const getCustomers = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customers = await DistributorCustomer.find({ organizationId: orgId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { customers } });
  } catch (error) { next(error); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const data = { ...req.body, organizationId: orgId };
    
    // Set initial currentDue to openingDue if provided
    if (data.openingDue) {
      data.currentDue = data.openingDue;
    }
    
    const newCustomer = await DistributorCustomer.create(data);
    res.status(201).json({ status: 'success', data: { customer: newCustomer } });
  } catch (error) { next(error); }
};

import DistributorSale from '../models/DistributorSale.js';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorCustomerLog from '../models/DistributorCustomerLog.js';

export const getCustomer = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;

    const customer = await DistributorCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

    // Fetch related data
    const sales = await DistributorSale.find({ customer: customerId, organizationId: orgId }).sort('-saleDate').limit(50);
    const payments = await DistributorPayment.find({ customer: customerId, organizationId: orgId, type: 'CUSTOMER_COLLECTION' }).sort('-date').limit(50);
    const logs = await DistributorCustomerLog.find({ customer: customerId, organizationId: orgId }).sort('-date');

    // Aggregate Analytics
    const salesAgg = await DistributorSale.aggregate([
      { $match: { customer: customer._id, organizationId: orgId } },
      { $group: {
          _id: null,
          totalWeight: { $sum: '$weight' },
          totalSalesValue: { $sum: '$netAmount' },
          totalPaid: { $sum: '$paidAmount' }
      }}
    ]);

    const analytics = salesAgg[0] || { totalWeight: 0, totalSalesValue: 0, totalPaid: 0 };

    res.status(200).json({ 
      status: 'success', 
      data: { 
        customer,
        analytics,
        sales,
        payments,
        logs
      } 
    });
  } catch (error) { next(error); }
};

export const addCustomerLog = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;
    const { text } = req.body;

    const log = await DistributorCustomerLog.create({
      organizationId: orgId,
      customer: customerId,
      text
    });

    res.status(201).json({ status: 'success', data: { log } });
  } catch (error) { next(error); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const existingCustomer = await DistributorCustomer.findOne({ _id: req.params.id, organizationId: orgId });
    if (!existingCustomer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

    if (req.body.openingDue !== undefined) {
      const diff = Number(req.body.openingDue) - (existingCustomer.openingDue || 0);
      
      // Self-correct for records affected by the earlier bug where currentDue stayed 0
      if (existingCustomer.currentDue === 0 && existingCustomer.openingDue > 0) {
        req.body.currentDue = Number(req.body.openingDue);
      } else {
        req.body.currentDue = existingCustomer.currentDue + diff;
      }
    }

    const customer = await DistributorCustomer.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ status: 'success', data: { customer } });
  } catch (error) { next(error); }
};
