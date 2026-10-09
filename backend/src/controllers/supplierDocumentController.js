import SupplierDocument from '../models/SupplierDocument.js';
import AppError from '../utils/AppError.js';

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await SupplierDocument.find({ organizationId: req.user.organizationId })
      .populate('uploadedBy', 'name')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { documents } });
  } catch (error) { next(error); }
};

export const createDocument = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    // In a real app, file handling (e.g. multer + AWS S3) happens here. 
    // For this boilerplate, we accept the fileUrl via body.
    const document = await SupplierDocument.create({
      ...req.body,
      organizationId: orgId,
      uploadedBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { document } });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await SupplierDocument.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!document) return next(new AppError('Document not found', 404));

    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
