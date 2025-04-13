/**
 * Logger utility to enable/disable console logs in production
 */

// Set to false to disable all logging in production
const enableLogging = process.env.NODE_ENV !== 'production';

// Define a more specific type for log arguments
type LogArgs = unknown[];

export const logger = {
  log: (...args: LogArgs) => {
    if (enableLogging) {
      console.log(...args);
    }
  },
  
  error: (...args: LogArgs) => {
    // We keep errors enabled even in production for critical issues
    console.error(...args);
  },
  
  warn: (...args: LogArgs) => {
    // Keeping warnings enabled in production
    console.warn(...args);
  },
  
  info: (...args: LogArgs) => {
    if (enableLogging) {
      console.info(...args);
    }
  },
  
  debug: (...args: LogArgs) => {
    if (enableLogging && process.env.DEBUG) {
      console.debug(...args);
    }
  }
};

export default logger; 