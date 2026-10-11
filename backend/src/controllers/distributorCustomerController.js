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

export const getCustomerLedger = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;

    const customer = await DistributorCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

    const [sales, payments] = await Promise.all([
      DistributorSale.find({ customer: customerId, organizationId: orgId }).sort('saleDate createdAt'),
      DistributorPayment.find({ customer: customerId, organizationId: orgId, type: 'CUSTOMER_COLLECTION' }).sort('date createdAt')
    ]);

    const entries = [];

    if (customer.openingDue && customer.openingDue > 0) {
      entries.push({
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        referenceNumber: 'OPENING',
        description: 'Opening Due (Purana Khata)',
        debit: customer.openingDue,
        credit: 0
      });
    }

    sales.forEach(sale => {
      entries.push({
        _id: sale._id,
        date: sale.saleDate || sale.createdAt,
        type: 'SALE',
        referenceNumber: sale.saleNumber,
        description: `Live Bird (${sale.weight} KG @ ₹${sale.sellingRate})`,
        debit: sale.netAmount,
        credit: 0,
        status: sale.paymentStatus,
        details: {
          weight: sale.weight,
          rate: sale.sellingRate,
          gross: sale.grossAmount,
          discount: sale.discount,
          otherCharges: sale.otherCharges
        }
      });

      if (sale.paidAmount && sale.paidAmount > 0) {
        entries.push({
          _id: `${sale._id}-paid`,
          date: sale.saleDate || sale.createdAt,
          type: 'PAYMENT',
          referenceNumber: `REC-${sale.saleNumber}`,
          description: `Cash/UPI at delivery #${sale.saleNumber}`,
          debit: 0,
          credit: sale.paidAmount,
          paymentMode: 'DELIVERY_CASH'
        });
      }
    });

    payments.forEach(pmt => {
      entries.push({
        _id: pmt._id,
        date: pmt.date || pmt.createdAt,
        type: 'PAYMENT',
        referenceNumber: pmt.reference || 'PAYMENT',
        description: pmt.notes || `Collection received via ${pmt.paymentMethod}`,
        debit: 0,
        credit: pmt.amount,
        paymentMode: pmt.paymentMethod,
        transactionRef: pmt.reference
      });
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledger = entries.map(item => {
      totalDebit += item.debit;
      totalCredit += item.credit;
      runningBalance += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: Math.max(0, runningBalance)
      };
    });

    const displayLedger = [...ledger].reverse();
    const currentDue = customer.currentDue !== undefined ? customer.currentDue : Math.max(0, runningBalance);

    res.status(200).json({
      status: 'success',
      data: {
        customer,
        summary: {
          openingBalance: customer.openingDue || 0,
          totalBilled: totalDebit,
          totalPaid: totalCredit,
          currentDue: currentDue,
          creditLimit: customer.creditLimit || 0,
          creditUtilizationPercent: customer.creditLimit > 0 
            ? Math.round((currentDue / customer.creditLimit) * 100) 
            : 0,
          isOverLimit: customer.creditLimit > 0 && currentDue > customer.creditLimit
        },
        ledger: displayLedger
      }
    });
  } catch (error) { next(error); }
};

export const recordCustomerPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;
    const { amount, paymentMethod = 'CASH', reference = '', notes = '', date = new Date() } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid payment amount is required' });
    }

    const customer = await DistributorCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

    const newPayment = await DistributorPayment.create([{
      organizationId: orgId,
      type: 'CUSTOMER_COLLECTION',
      amount: numAmount,
      paymentMethod,
      customer: customerId,
      date,
      reference,
      notes
    }]);

    customer.currentDue = Math.max(0, customer.currentDue - numAmount);
    await customer.save();

    res.status(201).json({
      status: 'success',
      data: {
        payment: newPayment[0],
        customer
      }
    });
  } catch (error) { next(error); }
};
