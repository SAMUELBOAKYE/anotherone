const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Error Handler Middleware
 * Centralized error handling for the application
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Mongoose duplicate key error (11000)
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use another value.`;
  
  return new AppError(message, HTTP_STATUS.CONFLICT, 'DUPLICATE_KEY');
};

/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(val => val.message);
  const message = messages.join(', ');
  
  return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
};

/**
 * Handle Mongoose Cast error (invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST, 'INVALID_ID');
};

/**
 * Handle JWT errors
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError(MESSAGES.ERROR.TOKEN_INVALID || 'Invalid token', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError(MESSAGES.ERROR.TOKEN_EXPIRED || 'Token expired. Please login again', HTTP_STATUS.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }
  return new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, 'AUTH_ERROR');
};

/**
 * Handle Mongoose errors
 */
const handleMongooseError = (err) => {
  if (err.code === 11000) return handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') return handleValidationError(err);
  if (err.name === 'CastError') return handleCastError(err);
  return null;
};

/**
 * Development error response (detailed)
 */
const sendDevError = (err, res) => {
  logger.error(`ERROR: ${err.message}`);
  logger.error(`STACK: ${err.stack}`);
  
  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
    errorCode: err.errorCode
  });
};

/**
 * Production error response (sanitized)
 */
const sendProdError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode
    });
  } else {
    // Programming or other unknown error: don't leak details
    logger.error(`ERROR 💥: ${err.message}`);
    logger.error(`STACK: ${err.stack}`);
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.SERVER || 'Something went wrong',
      errorCode: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error object
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  error.errorCode = err.errorCode || 'UNKNOWN_ERROR';

  // Log error with request context
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
    userEmail: req.user?.email
  });

  // Handle specific error types
  let handledError = null;
  
  // Mongoose errors
  handledError = handleMongooseError(err);
  if (handledError) error = handledError;
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  
  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File too large. Maximum size is 5MB', HTTP_STATUS.BAD_REQUEST, 'FILE_TOO_LARGE');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError('Too many files uploaded', HTTP_STATUS.BAD_REQUEST, 'TOO_MANY_FILES');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError('Unexpected file field', HTTP_STATUS.BAD_REQUEST, 'UNEXPECTED_FILE');
    } else {
      error = new AppError(err.message, HTTP_STATUS.BAD_REQUEST, 'UPLOAD_ERROR');
    }
  }
  
  // Rate limit errors
  if (err.name === 'RateLimitError') {
    error = new AppError(MESSAGES.ERROR.RATE_LIMIT || 'Too many requests, please try again later', HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * Async wrapper to catch errors in async routes
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  catchAsync,
  AppError
};