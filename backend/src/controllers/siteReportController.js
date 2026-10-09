import SiteReport from '../models/SiteReport.js';
import AppError from '../utils/AppError.js';

export const createSiteReport = async (req, res, next) => {
  try {
    const report = await SiteReport.create({
      ...req.body,
      organizationId: req.user.organizationId,
      siteEngineerId: req.user._id,
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteReports = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const reports = await SiteReport.find(filter)
      .populate('siteEngineerId', 'name')
      .populate('projectId', 'name projectCode')
      .sort('-reportDate');

    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

export const approveSiteReport = async (req, res, next) => {
  try {
    const report = await SiteReport.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { 
        status: 'APPROVED', 
        approvedAt: Date.now(),
        approvedBy: req.user._id 
      },
      { new: true }
    );

    if (!report) return next(new AppError('Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};
