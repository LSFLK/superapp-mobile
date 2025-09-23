const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev server proxy to bypass browser CORS when calling the Choreo payslip endpoints.
 * This file is picked up automatically by CRA when starting `npm start`.
 */
module.exports = function(app) {
  // Target for the external API
  const target = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev';
  
  console.log('[setupProxy] Payslip API target =>', target);

  // Proxy for payslip upload endpoint
  app.use('/api/payslips/upload', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/payslips/upload': '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload'
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[setupProxy] (upload) -> ${proxyReq.method} ${target}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] (upload) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('[setupProxy] (upload) Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway (upload)', detail: err.message }));
    }
  }));

  // Proxy for payslip view/list endpoint
  app.use('/api/payslips/all', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/payslips/all': '/gov-superapp/microappbackendprodbranch/v1.0/all'
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[setupProxy] (view) -> ${proxyReq.method} ${target}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] (view) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('[setupProxy] (view) Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway (view)', detail: err.message }));
    }
  }));
};
