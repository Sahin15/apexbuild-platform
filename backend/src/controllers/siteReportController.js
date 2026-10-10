import SiteReport from '../models/SiteReport.js';
import AppError from '../utils/AppError.js';

export const createSiteReport = async (req, res, next) => {
  try {
    const reportData = { ...req.body };
    
    // Auto-generate DPR No if not provided
    if (!reportData.dprNo && reportData.reportDate) {
      const dStr = new Date(reportData.reportDate).toISOString().split('T')[0];
      reportData.dprNo = `DPR-${dStr}`;
    }

    const report = await SiteReport.create({
      ...reportData,
      organizationId: req.user.organizationId,
      siteEngineerId: req.user._id,
      createdBy: req.user._id
    });

    const populatedReport = await SiteReport.findById(report._id)
      .populate('siteEngineerId', 'name email role')
      .populate('projectId', 'name projectCode clientName');

    res.status(201).json({
      status: 'success',
      data: { report: populatedReport }
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteReports = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status) filter.status = req.query.status;

    const reports = await SiteReport.find(filter)
      .populate('siteEngineerId', 'name email role')
      .populate('projectId', 'name projectCode clientName')
      .populate('approvedBy', 'name email')
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

export const getSiteReportById = async (req, res, next) => {
  try {
    const report = await SiteReport.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('siteEngineerId', 'name email role')
      .populate('projectId', 'name projectCode clientName location')
      .populate('approvedBy', 'name email');

    if (!report) return next(new AppError('Daily Progress Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSiteReport = async (req, res, next) => {
  try {
    const report = await SiteReport.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('siteEngineerId', 'name email role')
      .populate('projectId', 'name projectCode clientName')
      .populate('approvedBy', 'name email');

    if (!report) return next(new AppError('Daily Progress Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSiteReport = async (req, res, next) => {
  try {
    const report = await SiteReport.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!report) return next(new AppError('Daily Progress Report not found', 404));

    res.status(200).json({
      status: 'success',
      message: 'Daily Progress Report deleted successfully'
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
        approvedAt: new Date(),
        approvedBy: req.user._id,
        rejectionReason: ''
      },
      { new: true }
    )
      .populate('siteEngineerId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('projectId', 'name projectCode');

    if (!report) return next(new AppError('Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectSiteReport = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const report = await SiteReport.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { 
        status: 'REJECTED', 
        rejectionReason: reason || 'Information incomplete or requires revision'
      },
      { new: true }
    )
      .populate('siteEngineerId', 'name email')
      .populate('projectId', 'name projectCode');

    if (!report) return next(new AppError('Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getDPRSummary = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const reports = await SiteReport.find(filter).sort('-reportDate');

    let totalWorkforceToday = 0;
    let totalEquipmentActive = 0;
    let totalMaterialsReceived = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let safetyDaysWithoutIncident = 48; // Baseline construction safety streak

    if (reports.length > 0) {
      const latest = reports[0];
      totalWorkforceToday = latest.totalManpower || 0;
      totalEquipmentActive = (latest.equipment || []).filter(e => (e.hoursRun || 0) > 0).length;
      totalMaterialsReceived = (latest.materialsReceived || []).length;
      
      reports.forEach(r => {
        if (r.status === 'APPROVED') totalApproved++;
        else if (r.status === 'SUBMITTED') totalPending++;
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalReports: reports.length,
          totalWorkforceToday,
          totalEquipmentActive,
          totalMaterialsReceived,
          totalApproved,
          totalPending,
          safetyDaysWithoutIncident
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

