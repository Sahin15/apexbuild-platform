import Document from '../models/Document.js';
import AppError from '../utils/AppError.js';

export const getDocuments = async (req, res, next) => {
  try {
    let filter = { organizationId: req.user.organizationId };
    
    const projectId = req.params.projectId || req.query.projectId;
    if (projectId && projectId !== 'ALL') {
      filter.projectId = projectId;
    }

    if (req.query.docType && req.query.docType !== 'ALL') {
      filter.docType = req.query.docType;
    }

    if (req.query.discipline && req.query.discipline !== 'ALL') {
      filter.discipline = req.query.discipline;
    }

    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'All' && req.query.category !== 'ALL') {
      filter.category = req.query.category;
    }

    if (req.query.testType && req.query.testType !== 'ALL') {
      filter.testType = req.query.testType;
    }

    if (req.query.drawingNumber) {
      filter.drawingNumber = req.query.drawingNumber.toUpperCase().trim();
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { drawingNumber: searchRegex },
        { certificateNumber: searchRegex },
        { locationElement: searchRegex },
        { description: searchRegex }
      ];
    }

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('projectId', 'name projectCode')
      .populate('previousRevision', 'revision drawingNumber status createdAt')
      .populate('supersededBy', 'revision drawingNumber status createdAt')
      .sort('-createdAt');
      
    res.status(200).json({ 
      status: 'success', 
      results: documents.length, 
      data: { documents } 
    });
  } catch (error) {
    next(error);
  }
};

export const getVaultSummary = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    const filter = { organizationId: req.user.organizationId };
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const allDocs = await Document.find(filter);

    const totalDrawings = allDocs.filter(d => d.docType === 'DRAWING_GFC').length;
    const activeGfcCount = allDocs.filter(d => d.docType === 'DRAWING_GFC' && d.status === 'GFC_ACTIVE').length;
    const supersededCount = allDocs.filter(d => d.docType === 'DRAWING_GFC' && d.status === 'SUPERSEDED').length;
    const underReviewCount = allDocs.filter(d => d.status === 'UNDER_REVIEW').length;
    
    const qualityCerts = allDocs.filter(d => d.docType === 'QUALITY_CERTIFICATE');
    const cubeTests = qualityCerts.filter(d => d.testType === 'CONCRETE_CUBE_TEST');
    const passedCubeTests = cubeTests.filter(d => d.complianceStatus === 'PASS').length;
    const cubePassRate = cubeTests.length > 0 ? Math.round((passedCubeTests / cubeTests.length) * 100) : 100;

    res.status(200).json({
      status: 'success',
      data: {
        totalDocuments: allDocs.length,
        totalDrawings,
        activeGfcCount,
        supersededCount,
        underReviewCount,
        qualityCertsCount: qualityCerts.length,
        cubeTestsCount: cubeTests.length,
        cubePassRate
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      category, 
      docType,
      drawingNumber,
      discipline,
      revision,
      revisionNotes,
      status,
      issuedBy,
      releaseDate,
      testType,
      certificateNumber,
      testingAgency,
      testDate,
      concreteGrade,
      locationElement,
      sevenDayStrength,
      twentyEightDayStrength,
      targetStrength,
      complianceStatus,
      fileUrl, 
      fileName,
      fileType, 
      size, 
      projectId,
      tags
    } = req.body;

    const targetProjectId = req.params.projectId || projectId;
    if (!targetProjectId) {
      return next(new AppError('Project ID is required', 400));
    }

    const docTypeFinal = docType || (category === 'Drawings & Blueprints' ? 'DRAWING_GFC' : 
                                    category === 'Quality & Test Certificates' ? 'QUALITY_CERTIFICATE' : 'GENERAL');

    let previousRevisionDoc = null;

    // AUTO-SUPERSEDE: If this is an active GFC drawing, mark any existing revision as SUPERSEDED
    if (docTypeFinal === 'DRAWING_GFC' && drawingNumber) {
      const activeOld = await Document.findOne({
        organizationId: req.user.organizationId,
        projectId: targetProjectId,
        drawingNumber: drawingNumber.toUpperCase().trim(),
        status: 'GFC_ACTIVE'
      });

      if (activeOld) {
        previousRevisionDoc = activeOld;
      }
    }

    const document = await Document.create({
      organizationId: req.user.organizationId,
      projectId: targetProjectId,
      docType: docTypeFinal,
      title,
      description: description || '',
      category: category || (docTypeFinal === 'DRAWING_GFC' ? 'Drawings & Blueprints' : 
                            docTypeFinal === 'QUALITY_CERTIFICATE' ? 'Quality & Test Certificates' : 'Other'),
      drawingNumber: drawingNumber ? drawingNumber.toUpperCase().trim() : undefined,
      discipline: discipline || 'STRUCTURAL',
      revision: revision ? revision.toUpperCase().trim() : 'R0',
      revisionNotes: revisionNotes || '',
      status: status || 'GFC_ACTIVE',
      issuedBy: issuedBy || 'Consulting Structural Engineer / Client',
      releaseDate: releaseDate || new Date(),
      previousRevision: previousRevisionDoc ? previousRevisionDoc._id : undefined,

      testType: testType || 'CONCRETE_CUBE_TEST',
      certificateNumber: certificateNumber || '',
      testingAgency: testingAgency || 'NABL Accredited Testing Laboratory',
      testDate: testDate || new Date(),
      concreteGrade: concreteGrade || 'M25',
      locationElement: locationElement || '',
      sevenDayStrength: Number(sevenDayStrength) || 0,
      twentyEightDayStrength: Number(twentyEightDayStrength) || 0,
      targetStrength: Number(targetStrength) || (concreteGrade ? Number(concreteGrade.replace(/\D/g, '')) || 25 : 25),
      complianceStatus: complianceStatus || 'PASS',

      fileUrl: fileUrl || `https://apexbuild-vault.internal/files/${drawingNumber || 'DOC'}_${revision || 'R0'}.pdf`,
      fileName: fileName || `${title}.pdf`,
      fileType: fileType || 'pdf',
      fileSize: size || 2450000,
      tags: tags || [],
      uploadedBy: req.user.id
    });

    // If we had an older active GFC drawing, update it to superseded
    if (previousRevisionDoc && document.status === 'GFC_ACTIVE') {
      previousRevisionDoc.status = 'SUPERSEDED';
      previousRevisionDoc.supersededBy = document._id;
      await previousRevisionDoc.save();
    }
    
    await document.populate('uploadedBy', 'name email');
    await document.populate('projectId', 'name projectCode');

    res.status(201).json({ status: 'success', data: { document } });
  } catch (error) {
    next(error);
  }
};

export const uploadRevision = async (req, res, next) => {
  try {
    const parentDoc = await Document.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!parentDoc) {
      return next(new AppError('Original drawing document not found', 404));
    }

    const { revision, revisionNotes, fileUrl, fileName, issuedBy, releaseDate } = req.body;

    const nextRevision = revision ? revision.toUpperCase().trim() : `R${parseInt(parentDoc.revision.replace(/\D/g, '') || 0) + 1}`;

    const newRevisionDoc = await Document.create({
      organizationId: req.user.organizationId,
      projectId: parentDoc.projectId,
      docType: 'DRAWING_GFC',
      title: parentDoc.title,
      description: parentDoc.description,
      category: 'Drawings & Blueprints',
      drawingNumber: parentDoc.drawingNumber,
      discipline: parentDoc.discipline,
      revision: nextRevision,
      revisionNotes: revisionNotes || `Revision update from ${parentDoc.revision}`,
      status: 'GFC_ACTIVE',
      issuedBy: issuedBy || parentDoc.issuedBy,
      releaseDate: releaseDate || new Date(),
      previousRevision: parentDoc._id,
      fileUrl: fileUrl || `https://apexbuild-vault.internal/files/${parentDoc.drawingNumber}_${nextRevision}.pdf`,
      fileName: fileName || `${parentDoc.drawingNumber}_${nextRevision}.pdf`,
      fileType: 'pdf',
      fileSize: 2850000,
      uploadedBy: req.user.id
    });

    // Mark parent as SUPERSEDED
    parentDoc.status = 'SUPERSEDED';
    parentDoc.supersededBy = newRevisionDoc._id;
    await parentDoc.save();

    await newRevisionDoc.populate('uploadedBy', 'name email');
    await newRevisionDoc.populate('projectId', 'name projectCode');
    await newRevisionDoc.populate('previousRevision', 'revision drawingNumber status');

    res.status(201).json({
      status: 'success',
      data: { document: newRevisionDoc }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email').populate('projectId', 'name projectCode');

    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    res.status(200).json({ status: 'success', data: { document } });
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
