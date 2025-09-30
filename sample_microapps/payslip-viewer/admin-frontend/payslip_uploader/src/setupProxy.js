/**
 * Development Server Proxy Configuration
 * 
 * This file configures proxy middleware for the React development server to handle
 * Cross-Origin Resource Sharing (CORS) issues when communicating with external APIs.
 * 
 * PURPOSE AND FUNCTIONALITY:
 * =========================
 * Modern browsers enforce CORS policies that prevent web applications from making
 * direct requests to external domains without proper CORS headers. This proxy
 * configuration solves this issue by:
 * 
 * 1. Intercepting API requests from the frontend application
 * 2. Forwarding them server-side to the external Choreo API
 * 3. Returning the responses to the frontend without CORS restrictions
 * 4. Providing comprehensive logging for debugging and monitoring
 * 
 * TECHNICAL ARCHITECTURE:
 * ======================
 * - Uses http-proxy-middleware for robust proxy functionality
 * - Automatically loaded by Create React App during development
 * - Runs on the Node.js development server (not in the browser)
 * - Provides transparent proxying with request/response transformation
 * - Includes comprehensive error handling and logging
 * 
 * DEVELOPMENT WORKFLOW:
 * ====================
 * - Frontend makes requests to local paths (e.g., /api/payslips/upload)
 * - Proxy intercepts these requests before they reach the browser's network layer
 * - Requests are forwarded to external API with proper headers and authentication
 * - Responses are returned to frontend as if from same origin
 * - No CORS issues occur because browser sees same-origin requests
 * 
 * SECURITY AND PRODUCTION NOTES:
 * ==============================
 * - This proxy only runs in development mode (npm start)
 * - Production builds do not include this proxy
 * - Production deployments must handle CORS through proper backend configuration
 * - Authentication tokens are passed through transparently
 * - No credentials are stored or modified by the proxy
 * 
 * @fileoverview Development server proxy configuration for CORS handling
 * @requires http-proxy-middleware
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy Configuration Function
 * 
 * This function is automatically called by Create React App's development server
 * to configure proxy middleware. It sets up routing rules for API requests.
 * 
 * @param {Object} app - Express application instance from CRA dev server
 */
module.exports = function(app) {
  
  // ============================================================================
  // EXTERNAL API CONFIGURATION
  // ============================================================================
  
  /**
   * Target API base URL
   * 
   * Points to the Choreo-hosted backend API that provides payslip functionality.
   * This is the external domain that would normally cause CORS issues if called
   * directly from the browser.
   * 
   * @type {string}
   */
  const target = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev';
  
  // Log the target for debugging and development transparency
  console.log('[setupProxy] Payslip API target =>', target);

  // ============================================================================
  // PAYSLIP UPLOAD ENDPOINT PROXY
  // ============================================================================
  
  /**
   * Upload endpoint proxy configuration
   * 
   * Handles file upload requests from the frontend and forwards them to the
   * external Choreo API. This endpoint accepts multipart/form-data with CSV files
   * containing payslip information.
   * 
   * REQUEST FLOW:
   * - Frontend: POST /api/payslips/upload
   * - Proxy: POST {target}/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload
   * - Response forwarded back to frontend
   * 
   * CONFIGURATION OPTIONS:
   * - target: External API base URL
   * - changeOrigin: Modifies Host header to match target
   * - logLevel: Debug logging for development
   * - pathRewrite: Transforms local path to external API path
   * - Event handlers: Comprehensive logging and error handling
   */
  app.use('/api/payslips/upload', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    
    /**
     * Path rewriting configuration
     * 
     * Transforms the frontend request path to the actual external API path.
     * This allows the frontend to use clean, simple paths while the proxy
     * handles the complex external API structure.
     */
    pathRewrite: {
      '^/api/payslips/upload': '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload'
    },
    
    /**
     * Request interceptor
     * 
     * Logs outgoing requests for debugging and monitoring purposes.
     * Helps track what requests are being made to the external API.
     * 
     * @param {Object} proxyReq - The outgoing request object
     * @param {Object} req - The original Express request object
     */
    onProxyReq: (proxyReq, req) => {
      console.log(`[setupProxy] (upload) -> ${proxyReq.method} ${target}${proxyReq.path}`);
    },
    
    /**
     * Response interceptor
     * 
     * Logs incoming responses for debugging and monitoring purposes.
     * Helps track the success/failure status of external API calls.
     * 
     * @param {Object} proxyRes - The incoming response object
     * @param {Object} req - The original Express request object
     */
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] (upload) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    
    /**
     * Error handler
     * 
     * Handles proxy errors gracefully by providing meaningful error responses
     * to the frontend. Prevents unhandled errors from crashing the dev server.
     * 
     * @param {Error} err - The error object
     * @param {Object} req - The Express request object
     * @param {Object} res - The Express response object
     */
    onError: (err, req, res) => {
      console.error('[setupProxy] (upload) Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway (upload)', detail: err.message }));
    }
  }));

  // ============================================================================
  // PAYSLIP DATA RETRIEVAL ENDPOINT PROXY
  // ============================================================================
  
  /**
   * Data retrieval endpoint proxy configuration
   * 
   * Handles requests to fetch all stored payslip data from the external API.
   * This endpoint returns JSON data containing all payslip records for display
   * in the application's data table.
   * 
   * REQUEST FLOW:
   * - Frontend: GET /api/payslips/all
   * - Proxy: GET {target}/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all
   * - JSON response with payslip data forwarded back to frontend
   * 
   * DATA FORMAT:
   * The external API returns data in the format:
   * {
   *   status: 'success',
   *   data: [
   *     {
   *       employeeId: string,
   *       name: string,
   *       designation: string,
   *       department: string,
   *       payPeriod: string,
   *       basicSalary: number,
   *       allowances: number,
   *       deductions: number,
   *       netSalary: number
   *     },
   *     ...
   *   ]
   * }
   * 
   * AUTHENTICATION:
   * This endpoint requires proper JWT tokens (ID token + Access token) to be
   * included in the request headers. The proxy forwards these tokens transparently.
   */
  app.use('/api/payslips/all', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    
    /**
     * Path rewriting for data retrieval endpoint
     * 
     * Maps the clean frontend API path to the complex external API structure.
     * This abstraction allows for easier frontend development and potential
     * API changes without frontend modifications.
     */
    pathRewrite: {
      '^/api/payslips/all': '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all'
    },
    
    /**
     * Request interceptor for data retrieval
     * 
     * Logs outgoing data requests for monitoring and debugging.
     * Particularly useful for tracking authentication token issues
     * or request frequency patterns.
     * 
     * @param {Object} proxyReq - The outgoing request object
     * @param {Object} req - The original Express request object
     */
    onProxyReq: (proxyReq, req) => {
      console.log(`[setupProxy] (view) -> ${proxyReq.method} ${target}${proxyReq.path}`);
    },
    
    /**
     * Response interceptor for data retrieval
     * 
     * Logs incoming data responses including status codes.
     * Helps identify issues with data fetching, authentication,
     * or external API availability.
     * 
     * @param {Object} proxyRes - The incoming response object
     * @param {Object} req - The original Express request object
     */
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] (view) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    
    /**
     * Error handler for data retrieval
     * 
     * Provides graceful error handling for data fetching failures.
     * Returns meaningful error messages that the frontend can display
     * to users when data loading fails.
     * 
     * @param {Error} err - The error object
     * @param {Object} req - The Express request object
     * @param {Object} res - The Express response object
     */
    onError: (err, req, res) => {
      console.error('[setupProxy] (view) Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway (view)', detail: err.message }));
    }
  }));
};
