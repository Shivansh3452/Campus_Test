import logger from '../services/logger';

export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export class ErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.lastErrorTime = null;
  }

  handleError(error, context = {}) {
    const now = Date.now();
    if (this.lastErrorTime && now - this.lastErrorTime < 60000) {
      this.errorCount++;
    } else {
      this.errorCount = 1;
    }
    this.lastErrorTime = now;

    const errorType = this.determineErrorType(error);
    
    logger.error(`Error: ${errorType}`, {
      error: error.message,
      context,
      count: this.errorCount
    });

    return {
      action: 'display',
      message: error.message || 'An error occurred',
      severity: 'error'
    };
  }

  determineErrorType(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
      return ErrorTypes.NETWORK;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return ErrorTypes.AUTH;
    }
    if (error.response?.status === 429) {
      return ErrorTypes.RATE_LIMIT;
    }
    if (error.response?.status >= 500) {
      return ErrorTypes.SERVER;
    }
    return ErrorTypes.UNKNOWN;
  }

  getUserMessage(errorType) {
    const messages = {
      [ErrorTypes.NETWORK]: 'Network error. Please check your connection.',
      [ErrorTypes.AUTH]: 'Authentication error. Please login again.',
      [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment.',
      [ErrorTypes.SERVER]: 'Server error. Please try again later.',
      [ErrorTypes.UNKNOWN]: 'An unexpected error occurred.'
    };
    return messages[errorType] || messages[ErrorTypes.UNKNOWN];
  }
}

export const errorHandler = new ErrorHandler();