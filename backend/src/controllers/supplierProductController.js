import SupplierProduct from '../models/SupplierProduct.js';
import AppError from '../utils/AppError.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await SupplierProduct.find({ organizationId: req.user.organizationId })
      .populate('preferredVendorId', 'name')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { products } });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await SupplierProduct.create({
      ...req.body,
      organizationId: req.user.organizationId
    });
    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Product with this SKU already exists', 400));
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await SupplierProduct.findOne({ _id: req.params.id, organizationId: req.user.organizationId })
      .populate('preferredVendorId', 'name');
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await SupplierProduct.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Product with this SKU already exists', 400));
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await SupplierProduct.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!product) return next(new AppError('Product not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
