const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy for microapps endpoints
  app.use([
    "/api/microapps",
    "/api/microapps/upload",
    /^\/api\/microapps\/[^/]+$/ // Matches /api/microapps/:appId
  ],
    createProxyMiddleware({
      target: "http://localhost:9090",
      changeOrigin: true,
      pathRewrite: (path, req) => {
        if (path === "/api/microapps/upload") return "/micro-apps";
        if (path === "/api/microapps") return "/micro-apps";
        // Handle DELETE /api/microapps/:appId -> /micro-apps/:appId
        const match = path.match(/^\/api\/microapps\/(.+)$/);
        if (match) {
          return `/micro-apps/${match[1]}`;
        }
        return path;
      },
      onProxyReq: (proxyReq) => {
        if (!proxyReq.getHeader("x-jwt-assertion")) {
          proxyReq.setHeader("x-jwt-assertion", "<YOUR_ACCESS_TOKEN>");
        }
      },
    })
  );

  // Proxy for user info endpoint (always proxies to /user-info, no email param)
  app.use(
    "/api/users",
    createProxyMiddleware({
      target: "http://localhost:9090",
      changeOrigin: true,
      pathRewrite: () => "/user-info",
      onProxyReq: (proxyReq) => {
        if (!proxyReq.getHeader("x-jwt-assertion")) {
          proxyReq.setHeader("x-jwt-assertion", "<YOUR_ACCESS_TOKEN>");
        }
      },
    })
  );
};
