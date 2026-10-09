import SupplierQuotation from '../models/SupplierQuotation.js';
import AppError from '../utils/AppError.js';

export const getQuotations = async (req, res, next) => {
  try {
    const quotations = await SupplierQuotation.find({ organizationId: req.user.organizationId })
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku unit')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { quotations } });
  } catch (error) { next(error); }
};

export const createQuotation = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    const count = await SupplierQuotation.countDocuments({ organizationId: orgId });
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await SupplierQuotation.create({
      ...req.body,
      quotationNumber,
      organizationId: orgId,
      createdBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { quotation } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Quotation number already exists', 400));
    next(error);
  }
};

export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const quotation = await SupplierQuotation.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status },
      { new: true, runValidators: true }
    );
    if (!quotation) return next(new AppError('Quotation not found', 404));

    res.status(200).json({ status: 'success', data: { quotation } });
  } catch (error) { next(error); }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await SupplierQuotation.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!quotation) return next(new AppError('Quotation not found', 404));

    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
