import Snag from '../models/Snag.js';
import Project from '../models/Project.js';

export const getSnags = async (req, res, next) => {
  try {
    const { projectId, status, severity, category, search } = req.query;
    const filter = { organizationId: req.user.organizationId };

    if (projectId && projectId !== 'ALL') filter.projectId = projectId;
    if (status && status !== 'ALL') filter.status = status;
    if (severity && severity !== 'ALL') filter.severity = severity;
    if (category && category !== 'ALL') filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { snagNumber: { $regex: search, $options: 'i' } },
        { tradeOrGang: { $regex: search, $options: 'i' } }
      ];
    }

    const snags = await Snag.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('identifiedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { snags }
    });
  } catch (error) {
    next(error);
  }
};

export const createSnag = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      severity,
      location,
      tradeOrGang,
      dueDate,
      assignedTo,
      costImpact,
      photos
    } = req.body;

    if (!projectId || !title || !description || !location) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project, title, description, and location are required'
      });
    }

    // Auto-generate Snag Number
    const count = await Snag.countDocuments({ organizationId: req.user.organizationId });
    const year = new Date().getFullYear();
    const snagNumber = `SNG-${year}-${String(count + 1).padStart(3, '0')}`;

    const snag = await Snag.create({
      organizationId: req.user.organizationId,
      projectId,
      snagNumber,
      title,
      description,
      category: category || 'CONCRETE',
      severity: severity || 'MAJOR',
      location,
      tradeOrGang: tradeOrGang || 'General Civil Gang',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 5 * 86400000), // Default 5 days
      assignedTo: assignedTo || tradeOrGang || '',
      costImpact: Number(costImpact) || 0,
      photos: photos || [],
      identifiedBy: req.user._id,
      status: 'OPEN'
    });

    res.status(201).json({
      status: 'success',
      data: { snag }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSnag = async (req, res, next) => {
  try {
    const { status, rectificationNotes, costImpact, dueDate, tradeOrGang, assignedTo, photos } = req.body;
    
    const updateData = { ...req.body };

    // If status moving to RESOLVED or VERIFIED_CLOSED, set dates and user
    if (status === 'RESOLVED' || status === 'VERIFIED_CLOSED') {
      updateData.resolvedDate = updateData.resolvedDate || new Date();
      if (status === 'VERIFIED_CLOSED') {
        updateData.verifiedBy = req.user._id;
      }
    }

    const snag = await Snag.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name projectCode')
      .populate('identifiedBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!snag) {
      return res.status(404).json({ status: 'fail', message: 'Snag item not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { snag }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSnag = async (req, res, next) => {
  try {
    const snag = await Snag.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!snag) {
      return res.status(404).json({ status: 'fail', message: 'Snag item not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Snag deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSnagsSummary = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const snags = await Snag.find(filter);

    const totalSnags = snags.length;
    const openCount = snags.filter(s => s.status === 'OPEN').length;
    const inProgressCount = snags.filter(s => s.status === 'IN_PROGRESS').length;
    const resolvedCount = snags.filter(s => s.status === 'RESOLVED').length;
    const verifiedCount = snags.filter(s => s.status === 'VERIFIED_CLOSED').length;
    
    const criticalOpenCount = snags.filter(s => s.severity === 'CRITICAL' && s.status !== 'VERIFIED_CLOSED').length;
    const majorOpenCount = snags.filter(s => s.severity === 'MAJOR' && s.status !== 'VERIFIED_CLOSED').length;

    const closedTotal = resolvedCount + verifiedCount;
    const clearanceRate = totalSnags > 0 ? Number(((closedTotal / totalSnags) * 100).toFixed(1)) : 100;

    res.status(200).json({
      status: 'success',
      data: {
        totalSnags,
        openCount,
        inProgressCount,
        resolvedCount,
        verifiedCount,
        criticalOpenCount,
        majorOpenCount,
        clearanceRate
      }
    });
  } catch (error) {
    next(error);
  }
};
