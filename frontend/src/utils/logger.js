/**
 * Environment-based logging utility
 * Logs only appear in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development' || 
                      window.location.search.includes('debug=true');

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  debug: (tag, ...args) => {
    if (isDevelopment) {
      console.log(`[${tag}]`, ...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger;
