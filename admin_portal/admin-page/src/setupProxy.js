const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev server proxy to bypass browser CORS when calling the Choreo payslip upload endpoint.
 * Usage (frontend code): fetch('/api/payslips/upload', { method: 'POST', body: formData })
 * This file is picked up automatically by CRA when starting `npm start`.
 */
module.exports = function(app) {
  // Upstream host (no path). Keep existing env override behavior.
  const target = process.env.PAYSLIP_API_TARGET || 'https://41200aa1-4106-4e6c-babf-311dce37c04a-dev.e1-us-east-azure.choreoapis.dev';

  console.log('[setupProxy] PAYSLIP_API_TARGET =>', target);

  // New confirmed upstream upload path (full path on host) provided by user.
  const upstreamUploadPath = process.env.PAYSLIP_API_UPSTREAM_PATH || '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload';
  console.log('[setupProxy] Using upstream upload path =>', upstreamUploadPath);

  app.use('/api/payslips', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => {
      // Expected incoming: /api/payslips/upload
      if (/^\/api\/payslips\/upload$/.test(path)) {
        // If upstreamUploadPath already contains version + resource we send directly.
        const rewritten = upstreamUploadPath;
        console.log(`[setupProxy] Rewriting ${path} -> ${rewritten}`);
        return rewritten;
      }
      console.warn('[setupProxy] Unhandled payslip path (no rewrite applied):', path);
      return path;
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[setupProxy] -> ${proxyReq.method} ${proxyReq.getHeader('host')}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('[setupProxy] Proxy error:', err.message);
    }
  }));
};
