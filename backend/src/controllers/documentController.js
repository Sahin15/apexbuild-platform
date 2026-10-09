import Document from '../models/Document.js';
import AppError from '../utils/AppError.js';

export const getDocuments = async (req, res, next) => {
  try {
    let filter = { organizationId: req.user.organizationId };
    
    // Support nested route /projects/:projectId/documents
    if (req.params.projectId) {
      filter.projectId = req.params.projectId;
    }

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name')
      .populate('projectId', 'name')
      .sort('-createdAt');
      
    res.status(200).json({ status: 'success', results: documents.length, data: { documents } });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const { title, description, category, fileUrl, fileType, size, projectId } = req.body;
    
    const document = await Document.create({
      title,
      description,
      category,
      fileUrl,
      fileType,
      size,
      projectId: req.params.projectId || projectId,
      organizationId: req.user.organizationId,
      uploadedBy: req.user.id
    });
    
    // Populate for immediate display
    await document.populate('uploadedBy', 'name');
    if (document.projectId) {
      await document.populate('projectId', 'name');
    }

    res.status(201).json({ status: 'success', data: { document } });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
