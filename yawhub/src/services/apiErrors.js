/**
 * API Error Classes
 * @version 2.0.0
 * @description Comprehensive error handling for API requests
 */

// Base API Error Class
export class APIError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

// Authentication Errors
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed. Please login again.', details = null) {
    super(message, 401, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class TokenExpiredError extends APIError {
  constructor(message = 'Your session has expired. Please login again.', details = null) {
    super(message, 401, 'TOKEN_EXPIRED', details);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends APIError {
  constructor(message = 'Invalid authentication token.', details = null) {
    super(message, 401, 'INVALID_TOKEN', details);
    this.name = 'InvalidTokenError';
  }
}

// Authorization Errors
export class AuthorizationError extends APIError {
  constructor(message = 'You do not have permission to perform this action.', details = null) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Access denied. Insufficient permissions.', details = null) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

// Validation Errors
export class ValidationError extends APIError {
  constructor(message = 'Validation failed.', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends APIError {
  constructor(message = 'Invalid request.', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

// Resource Errors
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found.', details = null) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message = 'Resource conflict.', details = null) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

// Network & Server Errors
export class NetworkError extends APIError {
  constructor(message = 'Network error. Please check your connection.', details = null) {
    super(message, 0, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ServerError extends APIError {
  constructor(message = 'Server error. Please try again later.', details = null) {
    super(message, 500, 'SERVER_ERROR', details);
    this.name = 'ServerError';
  }
}

export class TimeoutError extends APIError {
  constructor(message = 'Request timeout. Please try again.', details = null) {
    super(message, 408, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

// Rate Limiting
export class RateLimitError extends APIError {
  constructor(message = 'Too many requests. Please try again later.', details = null) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}

// Helper function to parse and throw appropriate error
export const parseAPIError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.error || error.message;
    const details = data?.details || null;

    switch (status) {
      case 400:
        throw new ValidationError(message, details);
      case 401:
        if (message.includes('expired')) {
          throw new TokenExpiredError(message, details);
        }
        if (message.includes('invalid')) {
          throw new InvalidTokenError(message, details);
        }
        throw new AuthenticationError(message, details);
      case 403:
        throw new ForbiddenError(message, details);
      case 404:
        throw new NotFoundError(message, details);
      case 408:
        throw new TimeoutError(message, details);
      case 409:
        throw new ConflictError(message, details);
      case 429:
        throw new RateLimitError(message, details);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(message, details);
      default:
        throw new APIError(message, status, 'UNKNOWN_ERROR', details);
    }
  } else if (error.request) {
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout.');
    }
    throw new NetworkError('No response from server.');
  } else {
    throw new APIError(error.message, 0, 'REQUEST_SETUP_ERROR');
  }
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Get error severity
export const getErrorSeverity = (error) => {
  if (error instanceof AuthenticationError || error instanceof TokenExpiredError) {
    return ErrorSeverity.HIGH;
  }
  if (error instanceof ForbiddenError || error instanceof AuthorizationError) {
    return ErrorSeverity.HIGH;
  }
  if (error instanceof ServerError || error instanceof NetworkError) {
    return ErrorSeverity.MEDIUM;
  }
  if (error instanceof ValidationError || error instanceof BadRequestError) {
    return ErrorSeverity.LOW;
  }
  if (error instanceof RateLimitError) {
    return ErrorSeverity.MEDIUM;
  }
  return ErrorSeverity.MEDIUM;
};

// User-friendly error messages
export const getUserFriendlyErrorMessage = (error) => {
  if (error instanceof AuthenticationError) {
    return 'Please login to continue.';
  }
  if (error instanceof TokenExpiredError) {
    return 'Your session has expired. Please login again.';
  }
  if (error instanceof ForbiddenError) {
    return "You don't have permission to perform this action.";
  }
  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }
  if (error instanceof NotFoundError) {
    return 'The requested resource was not found.';
  }
  if (error instanceof NetworkError) {
    return 'Network connection issue. Please check your internet.';
  }
  if (error instanceof ServerError) {
    return 'Server error. Our team has been notified. Please try again later.';
  }
  if (error instanceof RateLimitError) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  return 'An unexpected error occurred. Please try again.';
};

export default {
  APIError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  AuthorizationError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  NetworkError,
  ServerError,
  TimeoutError,
  RateLimitError,
  parseAPIError,
  getErrorSeverity,
  getUserFriendlyErrorMessage,
};
