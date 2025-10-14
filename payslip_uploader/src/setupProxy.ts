/**
 * Development Server Proxy Configuration (TypeScript)
 *
 * Note: Create React App loads proxy middleware from `src/setupProxy.js` at runtime.
 * We keep that JS file for the dev server, and provide this TypeScript version
 * for type safety and maintainability. Keep both files in sync.
 */

import type { Express, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function setupProxy(app: Express): void {
  // External API base URL (Choreo-hosted backend)
  const target = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev';
  // eslint-disable-next-line no-console
  console.log('[setupProxy] Payslip API target =>', target);

  // Upload endpoint proxy
  app.use(
    '/api/payslips/upload',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/payslips/upload': '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload',
      },
      on: {
        proxyReq: (proxyReq: any, _req: Request) => {
          // eslint-disable-next-line no-console
          console.log(`[setupProxy] (upload) -> ${proxyReq.method} ${target}${proxyReq.path}`);
        },
        proxyRes: (proxyRes: any, req: Request) => {
          // eslint-disable-next-line no-console
          console.log(`[setupProxy] (upload) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        },
        error: (err: Error, _req: Request, res: Response) => {
          // eslint-disable-next-line no-console
          console.error('[setupProxy] (upload) Proxy error:', err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: 'Bad gateway (upload)', detail: err.message }));
        },
      },
    }),
  );

  // Data retrieval endpoint proxy
  app.use(
    '/api/payslips/all',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/payslips/all': '/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all',
      },
      on: {
        proxyReq: (proxyReq: any, _req: Request) => {
          // eslint-disable-next-line no-console
          console.log(`[setupProxy] (view) -> ${proxyReq.method} ${target}${proxyReq.path}`);
        },
        proxyRes: (proxyRes: any, req: Request) => {
          // eslint-disable-next-line no-console
          console.log(`[setupProxy] (view) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        },
        error: (err: Error, _req: Request, res: Response) => {
          // eslint-disable-next-line no-console
          console.error('[setupProxy] (view) Proxy error:', err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: 'Bad gateway (view)', detail: err.message }));
        },
      },
    }),
  );
}
