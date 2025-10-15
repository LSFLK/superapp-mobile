import { createProxyMiddleware } from "http-proxy-middleware";

// Minimal app type to avoid depending on express types
type AppLike = {
  use: (...args: any[]) => void;
};

/**
 * Dev server proxy to bypass browser CORS when calling remote endpoints.
 * Note: CRA only loads `setupProxy.js` at runtime. This TS file is for type-safety
 * and documentation. Keep the JS file alongside to remain effective.
 */
export default function setupProxy(app: AppLike): void {
  // Resolve proxy log level from env with validation
  const allowedLogLevels = ["debug", "info", "warn", "error", "silent"] as const;
  type LogLevel = typeof allowedLogLevels[number];
  const normalizeLogLevel = (val: string | undefined, fallback: LogLevel): LogLevel => {
    if (!val) return fallback;
    const lc = val.toLowerCase();
    return (allowedLogLevels as readonly string[]).includes(lc) ? (lc as LogLevel) : fallback;
  };
  // Global/default log level for proxies
  const defaultLogLevel: LogLevel = normalizeLogLevel(
    process.env.PROXY_LOG_LEVEL || process.env.REACT_APP_PROXY_LOG_LEVEL,
    "debug",
  );

  // Upstream host (no path). Keep existing env override behavior.
  let target =
    "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapps.dev";
  // Normalize common mistakes (e.g., 'http:localhost:9090' or missing protocol)
  if (/^https?:localhost:\d+/.test(target)) {
    target = target.replace(/^(https?):/, "$1://");
  }
  if (!/^https?:\/\//.test(target)) {
    target = "http://" + target; // fallback assumption
  }

  // eslint-disable-next-line no-console
  console.log("[setupProxy] PAYSLIP_API_TARGET =>", target);

  // Final full URL = {target}/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload
  const upstreamUploadPath =
    "/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload";
  // eslint-disable-next-line no-console
  console.log("[setupProxy] Using upstream upload path =>", upstreamUploadPath);

  app.use(
    ["/upload", "/api/payslips/upload"],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: defaultLogLevel,
      pathRewrite: (path: string) => {
        if (path === "/upload" || path === "/api/payslips/upload") {
          // eslint-disable-next-line no-console
          console.log(
            `[setupProxy] Rewriting ${path} -> ${upstreamUploadPath}`,
          );
          return upstreamUploadPath;
        }
        return path;
      },
      onProxyRes: (proxyRes: any, req: any) => {
        // eslint-disable-next-line no-console
        console.log(
          `[setupProxy] <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`,
        );
      },
      onError: (err: Error, req: any, res: any) => {
        // eslint-disable-next-line no-console
        console.error("[setupProxy] Proxy error:", err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
        }
        res.end(JSON.stringify({ error: "Bad gateway", detail: err.message }));
      },
    }),
  );

  // ---------------------------------------------------------------------------
  // Micro-app upload proxy (avoids browser CORS when calling remote gateway)
  const microAppsTarget =
    "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev";
  const microAppsBasePath = "/gov-superapp/superappbackendprodbranch/v1.0";
  const microAppsUploadPath = "/micro-apps/upload";

  // eslint-disable-next-line no-console
  console.log("[setupProxy] MICROAPPS target =>", microAppsTarget);

  // Allow an override specific to micro-apps proxy, falling back to default
  const microAppsLogLevel: LogLevel = normalizeLogLevel(
    process.env.MICROAPPS_PROXY_LOG_LEVEL || process.env.REACT_APP_MICROAPPS_PROXY_LOG_LEVEL,
    defaultLogLevel,
  );

  app.use(
    "/api/microapps",
    createProxyMiddleware({
      target: microAppsTarget,
      changeOrigin: true,
      logLevel: microAppsLogLevel,
      pathRewrite: (path: string) => {
        if (path === "/api/microapps/upload") {
          const rewritten = microAppsBasePath + microAppsUploadPath;
          // eslint-disable-next-line no-console
          console.log(
            `[setupProxy] (microapps) Rewriting ${path} -> ${rewritten}`,
          );
          return rewritten;
        }
        return path;
      },
      onProxyReq: (proxyReq: any) => {
        const shouldStrip = process.env.MICROAPPS_STRIP_ASSERTION === "true";
        const assertion = proxyReq.getHeader?.("x-jwt-assertion");
        if (shouldStrip && assertion) {
          proxyReq.removeHeader?.("x-jwt-assertion");
          // eslint-disable-next-line no-console
          console.log(
            "[setupProxy] (microapps) Stripped x-jwt-assertion (MICROAPPS_STRIP_ASSERTION=true)",
          );
        } else if (!assertion) {
          // eslint-disable-next-line no-console
          console.log(
            "[setupProxy] (microapps) WARNING: x-jwt-assertion header missing",
          );
        }
        // eslint-disable-next-line no-console
        console.log(
          `[setupProxy] (microapps) -> ${proxyReq.method} ${microAppsTarget}${proxyReq.path}`,
        );
      },
      onProxyRes: (proxyRes: any, req: any) => {
        // eslint-disable-next-line no-console
        console.log(
          `[setupProxy] (microapps) <- ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`,
        );
      },
      onError: (err: Error, req: any, res: any) => {
        // eslint-disable-next-line no-console
        console.error("[setupProxy] (microapps) Proxy error:", err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
        }
        res.end(
          JSON.stringify({
            error: "Bad gateway (microapps)",
            detail: err.message,
          }),
        );
      },
    }),
  );
}
