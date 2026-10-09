import Task from '../models/Task.js';
import AppError from '../utils/AppError.js';

export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id,
      projectId: req.params.projectId || req.body.projectId
    });

    res.status(201).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const query = { organizationId: req.user.organizationId };
    
    if (req.params.projectId) {
      query.projectId = req.params.projectId;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
