import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

export const getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { clients } });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const client = await Client.create({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user.id
    });
    res.status(201).json({ status: 'success', data: { client } });
  } catch (error) {
    next(error);
  }
};
