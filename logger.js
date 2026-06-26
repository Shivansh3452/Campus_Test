/**
 * Production-ready logging middleware
 * Supports different log levels and environments
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

class Logger {
  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
    this.logs = [];
    this.maxLogs = 1000;
    this.enabled = true;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.logLevel = LOG_LEVELS[level];
    }
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Format log entry with timestamp and context
   */
  formatLog(level, message, data = null) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) : null,
      sessionId: this.getSessionId()
    };
  }

  /**
   * Sanitize sensitive data from logs
   */
  sanitizeData(data) {
    if (!data) return null;
    
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'authorization', 'apiKey', 'secret'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    if (!window.__sessionId) {
      window.__sessionId = this.generateSessionId();
    }
    return window.__sessionId;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Log to console and store in memory
   */
  log(level, message, data = null) {
    if (!this.enabled || this.logLevel > LOG_LEVELS[level]) {
      return;
    }

    const entry = this.formatLog(level, message, data);
    
    // Console output with colors
    const styles = {
      DEBUG: 'color: #6c757d',
      INFO: 'color: #0d6efd',
      WARN: 'color: #ffc107',
      ERROR: 'color: #dc3545'
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `%c[${entry.timestamp}] [${level}] ${message}`,
        styles[level] || '',
        data ? data : ''
      );
    } else {
      // In production, only log errors to console
      if (level === 'ERROR') {
        console.error(`[${entry.timestamp}] [ERROR] ${message}`, data || '');
      }
    }

    // Store in memory (with limit)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to logging service in production
    if (process.env.NODE_ENV === 'production' && level === 'ERROR') {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Send logs to remote service (mock implementation)
   */
  sendToLoggingService(entry) {
    // In real implementation, send to logging backend
    // This is a mock for demonstration
    try {
      navigator.sendBeacon?.('/api/logs', JSON.stringify(entry));
    } catch (e) {
      // Fail silently
    }
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  /**
   * Get logs for debugging
   */
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Create a child logger with context
   */
  child(context) {
    const childLogger = new Logger();
    childLogger.context = context;
    childLogger.log = (level, message, data) => {
      const enhancedData = { ...data, ...context };
      super.log(level, message, enhancedData);
    };
    return childLogger;
  }
}

// Create singleton instance
const logger = new Logger();

// Middleware for API calls
export const loggingMiddleware = {
  /**
   * Log API request
   */
  request(config) {
    const { method, url, params, data } = config;
    logger.info(`API Request: ${method.toUpperCase()} ${url}`, {
      method,
      url,
      params: params || null,
      data: data ? logger.sanitizeData(data) : null
    });
    return config;
  },

  /**
   * Log API response
   */
  response(response) {
    const { config, status, data } = response;
    logger.info(`API Response: ${status} ${config.url}`, {
      url: config.url,
      status,
      dataSize: data ? JSON.stringify(data).length : 0
    });
    return response;
  },

  /**
   * Log API error
   */
  error(error) {
    const { config, message, response } = error;
    
    if (response) {
      logger.error(`API Error: ${response.status} ${config?.url}`, {
        url: config?.url,
        status: response.status,
        message: response.data?.message || message
      });
    } else {
      logger.error(`API Error: ${message}`, {
        url: config?.url,
        message
      });
    }
    
    return Promise.reject(error);
  }
};

export default logger;