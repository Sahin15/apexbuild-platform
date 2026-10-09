import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import { calculateProjectFinancials } from '../services/financialService.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ organizationId: req.user.organizationId })
      .populate('clientId', 'name companyName')
      .populate('projectManagerId', 'name email');

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    })
    .populate('clientId', 'name companyName')
    .populate('projectManagerId', 'name email');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const financials = await calculateProjectFinancials(project._id, req.user.organizationId);

    res.status(200).json({
      status: 'success',
      data: { project, financials }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    // Prevent empty string to ObjectId cast errors
    if (updateData.clientId === "") updateData.clientId = null;
    if (updateData.projectManagerId === "") updateData.projectManagerId = null;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
