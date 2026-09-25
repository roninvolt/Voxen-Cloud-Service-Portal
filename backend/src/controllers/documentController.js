const path = require('path');
const documentModel = require('../models/documentModel');
const activityModel = require('../models/activityModel');
const { StorageService } = require('../services/storageService');
const { ALLOWED_CATEGORIES } = require('../config/storage');
const logger = require('../utils/logger');

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was provided for upload.',
      });
    }

    const { category = 'Other', description = '' } = req.body;

    const validatedCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'Other';

    // Store the file using the abstracted StorageService (Local or S3)
    const storedFile = await StorageService.saveFile(req.file, req.file.filename);

    // Save record to PostgreSQL database
    const document = await documentModel.create({
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category: validatedCategory,
      description: description.trim(),
      storagePath: storedFile.storagePath,
    });

    // Log upload activity
    await activityModel.log({
      userId: req.user.id,
      action: 'UPLOAD',
      documentId: document.id,
      metadata: {
        originalName: document.original_name,
        fileSize: document.file_size,
        category: document.category,
      },
    });

    logger.info(`Document uploaded successfully: ${document.original_name} (${document.id}) by user ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      document,
    });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      type = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
      scope = 'all', // For admin: 'all' or 'my'
    } = req.query;

    const isAdmin = req.user.role === 'ADMIN';
    const filterUserId = (!isAdmin || scope === 'my') ? req.user.id : null;

    const result = await documentModel.findDocuments({
      userId: filterUserId,
      isAdmin,
      search,
      category,
      type,
      sortBy,
      sortOrder,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Role check: Admin or document owner
    if (req.user.role !== 'ADMIN' && document.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this document.',
      });
    }

    return res.json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    if (req.user.role !== 'ADMIN' && document.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this document.',
      });
    }

    const fileStream = await StorageService.getFileStream(document.stored_name);

    // Escape and format filename for Content-Disposition
    const safeFilename = encodeURIComponent(document.original_name);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader('Content-Length', document.file_size);

    // Log activity
    await activityModel.log({
      userId: req.user.id,
      action: 'DOWNLOAD',
      documentId: document.id,
      metadata: { originalName: document.original_name },
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const previewDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    if (req.user.role !== 'ADMIN' && document.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to preview this document.',
      });
    }

    const fileStream = await StorageService.getFileStream(document.stored_name);

    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);

    // Log activity
    await activityModel.log({
      userId: req.user.id,
      action: 'VIEW',
      documentId: document.id,
      metadata: { originalName: document.original_name },
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    if (req.user.role !== 'ADMIN' && document.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document.',
      });
    }

    // Delete file from disk/S3
    try {
      await StorageService.deleteFile(document.stored_name);
    } catch (storageErr) {
      logger.warn(`Storage delete warning for file ${document.stored_name}:`, storageErr.message);
    }

    // Delete record from database
    await documentModel.delete(id);

    // Log activity
    await activityModel.log({
      userId: req.user.id,
      action: 'DELETE',
      documentId: null,
      metadata: { deletedDocumentId: id, originalName: document.original_name },
    });

    logger.info(`Document deleted: ${document.original_name} (${id}) by user ${req.user.email}`);

    return res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  previewDocument,
  deleteDocument,
};
