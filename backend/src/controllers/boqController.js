import BOQ from '../models/BOQ.js';
import BOQItem from '../models/BOQItem.js';
import AppError from '../utils/AppError.js';

export const createBOQ = async (req, res, next) => {
  try {
    const { projectId, name, version, items } = req.body;

    let boq = await BOQ.findOne({ projectId, organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    
    if (!boq) {
      boq = await BOQ.create({
        organizationId: req.user.organizationId,
        projectId,
        name,
        version,
        createdBy: req.user._id
      });
    }

    let boqItems = [];
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        boqId: boq._id,
        projectId,
        remainingQuantity: item.quantity,
        amount: item.quantity * item.rate
      }));

      boqItems = await BOQItem.insertMany(itemsToInsert);
      
      const newItemsTotal = boqItems.reduce((acc, curr) => acc + curr.amount, 0);
      boq.totalAmount = (boq.totalAmount || 0) + newItemsTotal;
      await boq.save();
    }

    res.status(201).json({
      status: 'success',
      data: { boq, items: boqItems }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectBOQ = async (req, res, next) => {
  try {
    const boqs = await BOQ.find({ projectId: req.params.projectId, organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    
    if (boqs.length === 0) {
      return res.status(200).json({ status: 'success', data: { boq: null, items: [] } });
    }

    const latestBoq = boqs[0]; // simplistic approach
    const items = await BOQItem.find({ boqId: latestBoq._id });

    res.status(200).json({
      status: 'success',
      data: { boq: latestBoq, items }
    });
  } catch (error) {
    next(error);
  }
};
