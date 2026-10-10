import Task from '../models/Task.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

export const createTask = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return next(new AppError('Project ID is required', 400));
    }

    const task = await Task.create({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id,
      projectId
    });

    const populated = await Task.findById(task._id)
      .populate('dependencies', 'title wbsCode status endDate')
      .populate('boqItemIds', 'itemCode description unit');

    res.status(201).json({
      status: 'success',
      data: { task: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const query = { organizationId: req.user.organizationId };
    
    if (req.params.projectId || req.query.projectId) {
      query.projectId = req.params.projectId || req.query.projectId;
    }
    if (req.query.phase && req.query.phase !== 'ALL') {
      query.phase = req.query.phase;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name projectCode')
      .populate('dependencies', 'title wbsCode status endDate progress')
      .populate('boqItemIds', 'itemCode description unit rate')
      .sort('startDate createdAt');

    // Aggregate schedule analytics
    let totalTasks = tasks.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let delayedCount = 0;
    let criticalPathCount = 0;
    let milestoneCount = 0;
    let totalProgressSum = 0;

    tasks.forEach(t => {
      totalProgressSum += t.progress || 0;
      if (t.status === 'completed' || t.progress === 100) completedCount++;
      else if (t.status === 'delayed' || (t.slippageDays > 0 && t.progress < 100)) delayedCount++;
      else if (t.status === 'in-progress' || t.progress > 0) inProgressCount++;

      if (t.isCriticalPath) criticalPathCount++;
      if (t.isMilestone) milestoneCount++;
    });

    const overallProgress = totalTasks > 0 ? Math.round(totalProgressSum / totalTasks) : 0;

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { 
        tasks,
        stats: {
          totalTasks,
          completedCount,
          inProgressCount,
          delayedCount,
          criticalPathCount,
          milestoneCount,
          overallProgress
        }
      }
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
    )
      .populate('dependencies', 'title wbsCode status endDate progress')
      .populate('boqItemIds', 'itemCode description unit');

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

export const logTaskProgress = async (req, res, next) => {
  try {
    const { progress, note } = req.body;
    const task = await Task.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    task.progress = Number(progress);
    task.progressLogs.push({
      date: new Date(),
      progress: Number(progress),
      note: note || '',
      updatedBy: req.user._id
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('dependencies', 'title wbsCode status endDate progress')
      .populate('boqItemIds', 'itemCode description unit');

    res.status(200).json({
      status: 'success',
      data: { task: populated }
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
