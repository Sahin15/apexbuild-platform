import DistributorEstimation from '../models/DistributorEstimation.js';
import DistributorCustomer from '../models/DistributorCustomer.js';

export const getEstimations = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { date } = req.query; // YYYY-MM-DD

    let queryDate = new Date();
    if (date) {
      queryDate = new Date(date);
    }
    
    // Set to start of day and end of day
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const estimations = await DistributorEstimation.find({
      organizationId: orgId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer', 'shopName route phone');

    // Also send all active customers so frontend can easily add new estimations
    const customers = await DistributorCustomer.find({ organizationId: orgId, status: 'ACTIVE' });

    res.status(200).json({
      status: 'success',
      data: {
        estimations,
        customers
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createEstimation = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { customerId, requestedWeight, date, notes } = req.body;

    const estimationDate = date ? new Date(date) : new Date();

    const estimation = await DistributorEstimation.create({
      organizationId: orgId,
      customer: customerId,
      date: estimationDate,
      requestedWeight: Number(requestedWeight),
      notes
    });

    const populated = await DistributorEstimation.findById(estimation._id).populate('customer', 'shopName route phone');

    res.status(201).json({
      status: 'success',
      data: { estimation: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEstimation = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { requestedWeight, status, notes } = req.body;

    const estimation = await DistributorEstimation.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      { requestedWeight: Number(requestedWeight), status, notes },
      { new: true }
    ).populate('customer', 'shopName route phone');

    if (!estimation) {
      return res.status(404).json({ status: 'error', message: 'Estimation not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { estimation }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEstimation = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    const estimation = await DistributorEstimation.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: orgId 
    });

    if (!estimation) {
      return res.status(404).json({ status: 'error', message: 'Estimation not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Estimation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
