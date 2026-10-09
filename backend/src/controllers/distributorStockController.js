import DistributorStock from '../models/DistributorStock.js';
import DistributorStockMovement from '../models/DistributorStockMovement.js';

export const getStock = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    let stock = await DistributorStock.findOne({ organizationId: orgId });
    if (!stock) stock = { currentStock: 0 };
    res.status(200).json({ status: 'success', data: { stock } });
  } catch (error) { next(error); }
};

export const getStockLedger = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const ledger = await DistributorStockMovement.find({ organizationId: orgId }).sort('-date -createdAt');
    res.status(200).json({ status: 'success', data: { ledger } });
  } catch (error) { next(error); }
};
