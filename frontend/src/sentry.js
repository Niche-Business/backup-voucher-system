import * as Sentry from "@sentry/react";

// Initialize Sentry for error tracking
// Note: Replace 'YOUR_SENTRY_DSN_HERE' with actual Sentry DSN from https://sentry.io
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracePropagationTargets: ["localhost", /^https:\/\/backup-voucher-system\.onrender\.com/],
      }),
      new Sentry.Replay({
        // Mask all text content for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance monitoring sample rate (1.0 = 100%)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay sample rate
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Filter sensitive data before sending to Sentry
    beforeSend(event, hint) {
      // Remove sensitive data from event
      if (event.request) {
        // Remove cookies and auth headers
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }
      
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove password fields
            if (breadcrumb.data.password) {
              breadcrumb.data.password = '[Filtered]';
            }
            if (breadcrumb.data.confirmPassword) {
              breadcrumb.data.confirmPassword = '[Filtered]';
            }
            // Remove email addresses
            if (breadcrumb.data.email) {
              breadcrumb.data.email = breadcrumb.data.email.replace(/(.{2}).*@/, '$1***@');
            }
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      // ResizeObserver errors (non-critical)
      'ResizeObserver loop limit exceeded',
    ],
  });
  
  console.log('Sentry initialized for error tracking');
} else {
  console.log('Sentry DSN not provided - error tracking disabled');
}

export default Sentry;
