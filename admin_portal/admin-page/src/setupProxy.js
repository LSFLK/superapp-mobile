const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev server proxy to bypass browser CORS when calling the Choreo payslip upload endpoint.
 * Usage (frontend code): fetch('/api/payslips/upload', { method: 'POST', body: formData })
 * This file is picked up automatically by CRA when starting `npm start`.
 */
module.exports = function(app) {
  // Upstream host (no path). Keep existing env override behavior.
  //const target = process.env.PAYSLIP_API_TARGET || 'https://41200aa1-4106-4e6c-babf-311dce37c04a-dev.e1-us-east-azure.choreoapis.dev';
  // Provided correct dev URL base (without the final resource path) so we can rewrite cleanly.
  let target = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev';
  // Normalize common mistakes (e.g., 'http:localhost:9090' or missing protocol)
  if (/^https?:localhost:\d+/.test(target)) {
    // Insert the missing '//'
    target = target.replace(/^(https?):/, '$1://');
  }
  if (!/^https?:\/\//.test(target)) {
    target = 'http://' + target; // fallback assumption
  }

  console.log('[setupProxy] PAYSLIP_API_TARGET =>', target);

  // New confirmed upstream upload path (full path on host) provided by user.
  //const upstreamUploadPath = process.env.PAYSLIP_API_UPSTREAM_PATH || '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload';
  // Correct upstream resource path for Excel upload (dev environment)
  // Final full URL = {target}/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload
  const upstreamUploadPath = '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload';
  console.log('[setupProxy] Using upstream upload path =>', upstreamUploadPath);

  app.use('/api/payslips', createProxyMiddleware({
    target,
    changeOrigin: true,
    // Keep debug while diagnosing; lower to 'info' later.
    logLevel: 'debug',
    // Only rewrite the specific upload route: /api/payslips/upload -> upstreamUploadPath
    pathRewrite: (path) => {
      if (path === '/api/payslips/upload') {
        console.log(`[setupProxy] Rewriting ${path} -> ${upstreamUploadPath}`);
        return upstreamUploadPath;
      }
      return path; // passthrough (if other endpoints are later added)
    },
    onProxyReq: (proxyReq, req) => {
      const host = proxyReq.getHeader('host');
      console.log(`[setupProxy] -> ${proxyReq.method} http://${host}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('[setupProxy] Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway', detail: err.message }));
    }
  }));

  // ---------------------------------------------------------------------------
  // Micro-app upload proxy (avoids browser CORS when calling remote gateway)
  // Frontend should call: fetch('/api/microapps/upload', { method: 'POST', body: FormData })
  // Configure target & upstream base via env for flexibility.
  const microAppsTarget = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev';
  const microAppsBasePath = '/gov-superapp/superappbackendprodbranch/v1.0';
  const microAppsUploadPath = '/micro-apps/upload';

  console.log('[setupProxy] MICROAPPS target =>', microAppsTarget);

  app.use('/api/microapps', createProxyMiddleware({
    target: microAppsTarget,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path) => {
      // /api/microapps/upload -> {basePath}{uploadPath}
      if (path === '/api/microapps/upload') {
        const rewritten = microAppsBasePath + microAppsUploadPath;
        console.log(`[setupProxy] (microapps) Rewriting ${path} -> ${rewritten}`);
        return rewritten;
      }
      return path;
    },
    onProxyReq: (proxyReq, req) => {
      const shouldStrip = process.env.MICROAPPS_STRIP_ASSERTION === 'true';
      const assertion = proxyReq.getHeader('x-jwt-assertion');
      if (shouldStrip && assertion) {
        proxyReq.removeHeader('x-jwt-assertion');
        console.log('[setupProxy] (microapps) Stripped x-jwt-assertion (MICROAPPS_STRIP_ASSERTION=true)');
      } else if (!assertion) {
        console.log('[setupProxy] (microapps) WARNING: x-jwt-assertion header missing');
      }
      console.log(`[setupProxy] (microapps) -> ${proxyReq.method} ${microAppsTarget}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[setupProxy] (microapps) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('[setupProxy] (microapps) Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Bad gateway (microapps)', detail: err.message }));
    }
  }));
};
