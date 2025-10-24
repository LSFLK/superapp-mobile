const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy for /proxy/micro-apps endpoints (to match frontend usage)
  app.use(
    [
      "/proxy/micro-apps",
      /^\/proxy\/micro-apps\/.*$/
    ],
    createProxyMiddleware({
      target: "http://localhost:9090",
      changeOrigin: true,
      pathRewrite: (path, req) => {
        // Remove /proxy prefix
        if (path.startsWith("/proxy/micro-apps")) {
          return path.replace("/proxy", "");
        }
        return path;
      },
  // Do not overwrite x-jwt-assertion header; allow frontend to pass its own JWT
  // onProxyReq: (proxyReq) => {
  //   if (!proxyReq.getHeader("x-jwt-assertion")) {
  //     proxyReq.setHeader("x-jwt-assertion", "<YOUR_ACCESS_TOKEN>");
  //   }
  // },
    })
  );
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
