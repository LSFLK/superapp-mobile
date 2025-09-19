const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev server proxy to bypass browser CORS when calling the Choreo payslip upload endpoint.
 * Usage (frontend code): fetch('/api/payslips/upload', { method: 'POST', body: formData })
 * This file is picked up automatically by CRA when starting `npm start`.
 */
module.exports = function(app) {
  const target = process.env.PAYSLIP_API_TARGET || 'https://41200aa1-4106-4e6c-babf-311dce37c04a-dev.e1-us-east-azure.choreoapis.dev';
  // Proxy only the specific microapp backend path segment we rely on
  app.use(
  '/api/payslips',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: 'info',
      pathRewrite: (path, req) => {
    // Incoming: /api/payslips/upload -> Outgoing: /gov-superapp/microappbackendprodbranch/v1.0/upload
    return path.replace(/^\/api\/payslips\/upload$/, '/gov-superapp/microappbackendprodbranch/v1.0/upload');
      },
      onProxyReq: (proxyReq, req, res) => {
        // Can inject headers here if needed (e.g., auth). None for now.
      },
    })
  );
};
