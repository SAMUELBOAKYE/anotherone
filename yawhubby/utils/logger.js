const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format for console
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0 && meta[Symbol.for('splat')] !== undefined) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Custom log format for files (JSON format for better parsing)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// Configure transports
const transportsList = [
  // Console transport for development
  new transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat,
    handleExceptions: true
  }),
  
  // File transport for all logs
  new DailyRotateFile({
    level: 'info',
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    handleExceptions: true
  }),
  
  // File transport for error logs only
  new DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    handleExceptions: true
  })
];

// Add separate info log file in production
if (process.env.NODE_ENV === 'production') {
  transportsList.push(
    new DailyRotateFile({
      level: 'info',
      filename: path.join(logDir, 'info-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  );
}

// Create the logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: process.env.APP_NAME || 'kaaf-noticeboard' },
  transports: transportsList,
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, 'rejections.log') })
  ],
  exitOnError: false
});

/**
 * Legacy wrapper for backward compatibility
 * This allows using the same API as the previous logger
 */
const legacyLogger = {
  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   */
  error: (message, error = null) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else if (error) {
      logger.error(message, { data: error });
    } else {
      logger.error(message);
    }
  },
  
  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(message, meta);
    }
  },
  
  /**
   * Log HTTP request
   * @param {string} message - HTTP message
   * @param {Object} meta - Additional metadata
   */
  http: (message, meta = {}) => {
    logger.http(message, meta);
  },
  
  /**
   * Log verbose message
   * @param {string} message - Verbose message
   * @param {Object} meta - Additional metadata
   */
  verbose: (message, meta = {}) => {
    logger.verbose(message, meta);
  },
  
  /**
   * Log with custom level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log: (level, message, meta = {}) => {
    logger.log(level, message, meta);
  },
  
  /**
   * Create a child logger with default metadata
   * @param {Object} defaultMeta - Default metadata to include
   * @returns {Object} Child logger
   */
  child: (defaultMeta) => {
    const child = logger.child(defaultMeta);
    return {
      info: (message, meta) => child.info(message, meta),
      error: (message, error) => {
        if (error instanceof Error) {
          child.error(message, { error: error.message, stack: error.stack });
        } else if (error) {
          child.error(message, { data: error });
        } else {
          child.error(message);
        }
      },
      warn: (message, meta) => child.warn(message, meta),
      debug: (message, meta) => child.debug(message, meta),
      http: (message, meta) => child.http(message, meta),
      verbose: (message, meta) => child.verbose(message, meta)
    };
  },
  
  /**
   * Get the underlying Winston logger instance
   * @returns {Object} Winston logger
   */
  getWinstonLogger: () => logger,
  
  /**
   * Flush all logs
   * @returns {Promise} Promise that resolves when logs are flushed
   */
  flush: () => {
    return new Promise((resolve) => {
      logger.on('finish', resolve);
      logger.end();
    });
  }
};

// Export the logger
module.exports = legacyLogger;

// Export also the Winston logger for advanced use cases
module.exports.winston = logger;