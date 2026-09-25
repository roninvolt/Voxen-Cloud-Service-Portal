const multer = require('multer');
const logger = require('../utils/logger');
const { MAX_FILE_SIZE } = require('../config/storage');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled request error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle Multer file size limit
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        success: false,
        message: `File is too large. Maximum allowed size is ${maxMb}MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  // Handle custom upload errors
  if (err.code === 'INVALID_FILE_TYPE' || err.code === 'INVALID_MIME_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // PostgreSQL duplicate key violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.',
    });
  }

  // Default response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error. Please try again later.'
    : err.message || 'Something went wrong.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
