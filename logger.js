// src/services/logger.js
import { sanitizeObject } from '../utils/security';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'NONE'
};

class Logger {
  constructor() {
    const envLevel = process.env.REACT_APP_LOG_LEVEL || 'INFO';
    this.logLevel = LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 1000;
    this.enabled = true;
    this.sessionId = this.generateSessionId();
    this.batchQueue = [];
    this.batchTimeout = null;
    this.isProduction = process.env.REACT_APP_ENV === 'production';
  }

  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.logLevel = LOG_LEVELS[level];
      this.info(`Log level set to ${level}`);
    }
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  formatLog(level, message, data = null) {
    return {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level] || 'INFO',
      message,
      data: data ? this.sanitizeData(data) : null,
      sessionId: this.sessionId,
      environment: this.isProduction ? 'production' : 'development',
      version: process.env.REACT_APP_VERSION || '1.0.0'
    };
  }

  sanitizeData(data) {
    if (!data) return null;
    return sanitizeObject(data);
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  log(level, message, data = null) {
    if (!this.enabled || this.logLevel > level) {
      return;
    }

    const entry = this.formatLog(level, message, data);
    
    // Console output with colors in development
    if (!this.isProduction) {
      const styles = {
        0: 'color: #6c757d; font-weight: lighter',
        1: 'color: #0d6efd; font-weight: normal',
        2: 'color: #ffc107; font-weight: bold',
        3: 'color: #dc3545; font-weight: bold'
      };

      const prefix = this.isProduction ? '' : `[${entry.timestamp}] `;
      console.log(
        `%c${prefix}[${entry.level}] ${message}`,
        styles[level] || '',
        data ? data : ''
      );
    } else {
      // In production, only log errors to console
      if (level === LOG_LEVELS.ERROR) {
        console.error(`[${entry.timestamp}] [ERROR] ${message}`, data || '');
      }
    }

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to logging service
    if (this.isProduction && level >= LOG_LEVELS.WARN) {
      this.sendToLoggingService(entry);
    }

    return entry;
  }

  debug(message, data = null) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data = null) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data = null) {
    return this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data = null) {
    return this.log(LOG_LEVELS.ERROR, message, data);
  }

  sendToLoggingService(entry) {
    // Batch logs to reduce network calls
    this.batchQueue.push(entry);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushLogs();
    }, 5000);
  }

  async flushLogs() {
    if (this.batchQueue.length === 0) return;
    
    const logs = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;
    
    try {
      // Send to logging endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/logs', JSON.stringify(logs));
      } else {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logs)
        });
      }
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-queue logs
      this.batchQueue = [...logs, ...this.batchQueue];
    }
  }

  getLogs(level = null) {
    if (level !== null && LOG_LEVEL_NAMES[level]) {
      return this.logs.filter(log => log.level === LOG_LEVEL_NAMES[level]);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.batchQueue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  child(context) {
    const childLogger = new Logger();
    childLogger.logLevel = this.logLevel;
    childLogger.enabled = this.enabled;
    childLogger.sessionId = this.sessionId;
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, data) => {
      const enhancedData = { ...data, ...context };
      return originalLog(level, message, enhancedData);
    };
    
    return childLogger;
  }

  getSessionId() {
    return this.sessionId;
  }
}

// Create singleton instance
const logger = new Logger();

// Logging middleware for API
export const loggingMiddleware = {
  request(config) {
    const { method, url, params, data } = config;
    logger.debug(`API Request: ${method.toUpperCase()} ${url}`, {
      method,
      url,
      params: params || null,
      data: data ? logger.sanitizeData(data) : null
    });
    return config;
  },

  response(response) {
    const { config, status, data } = response;
    logger.debug(`API Response: ${status} ${config.url}`, {
      url: config.url,
      status,
      dataSize: data ? JSON.stringify(data).length : 0
    });
    return response;
  },

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

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  logger.flushLogs();
});

export default logger;
