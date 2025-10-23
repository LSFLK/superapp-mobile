
import { createProxyMiddleware } from "http-proxy-middleware";

export default function setupProxy(app: { use: (...args: any[]) => void }) {
  app.use([
    "/api/microapps",
    "/api/microapps/upload"
  ],
    createProxyMiddleware({
      target: "http://localhost:9090",
      changeOrigin: true,
      pathRewrite: (path) => {
        if (path === "/api/microapps/upload") return "/micro-apps/upload";
        if (path === "/api/microapps") return "/micro-apps";
        return path;
      },
      onProxyReq: (proxyReq) => {
        // Set a placeholder x-jwt-assertion header for local dev/testing
        if (!proxyReq.getHeader("x-jwt-assertion")) {
          proxyReq.setHeader("x-jwt-assertion", "eyJ4NXQiOiI2aktpSGh0LXhXMlFVclVTQzJsM2Z1dFF3X2ciLCJraWQiOiJNV1F5TkRnNE1tSm1OR1EwTkRVeU1HSXlZbUZtWWpkaFpUY3pNamxsTXpWaU9UUmxNRGhqWlRVeVlURmpaREZtWmpBMU1tRXlPRFF6TVdGaFl6QmhNQV9SUzI1NiIsInR5cCI6ImF0K2p3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhMzhmZTMyOS0zNzYwLTRlODgtYTlmZS1lYmFlNGU0MTkyM2EiLCJhdXQiOiJBUFBMSUNBVElPTl9VU0VSIiwiYmluZGluZ190eXBlIjoic3NvLXNlc3Npb24iLCJpc3MiOiJodHRwczpcL1wvYXBpLmFzZ2FyZGVvLmlvXC90XC9sc2Zwcm9qZWN0XC9vYXV0aDJcL3Rva2VuIiwiZ3JvdXBzIjpbInN1cGVyYXBwX2FkbWluIiwiaHItc3RhZmYiXSwiZ2l2ZW5fbmFtZSI6IlNhcmFoIiwiY2xpZW50X2lkIjoiYVZybzNBVGY1WlNnbFpISXRFRGowS2Q3TTR3YSIsImF1ZCI6ImFWcm8zQVRmNVpTZ2xaSEl0RURqMEtkN000d2EiLCJuYmYiOjE3NjEyMDIwMjMsImF6cCI6ImFWcm8zQVRmNVpTZ2xaSEl0RURqMEtkN000d2EiLCJvcmdfaWQiOiJhNTJiZTU0NC04NmQ4LTRkMzctYTA2ZC02YjE5ZGExM2ZkMTQiLCJzY29wZSI6Imdyb3VwcyBvcGVuaWQgcHJvZmlsZSIsImV4cCI6MTc2NzQyMjgyMywib3JnX25hbWUiOiJsc2Zwcm9qZWN0IiwiaWF0IjoxNzYxMjAyMDIzLCJmYW1pbHlfbmFtZSI6IkxlZSIsImJpbmRpbmdfcmVmIjoiZWE1MmVjNWFhM2JhZGRiYjA3YjlkNzMxODM4MGIxNzUiLCJqdGkiOiJiYzI1NmEyNS0yNzRkLTRlODktYjNhZC00Y2RiMDIyMWQxNjEiLCJlbWFpbCI6InNhcmFoQGdvdi5jb20iLCJvcmdfaGFuZGxlIjoibHNmcHJvamVjdCJ9.u-EsGyijuUnp50xvMdcqB2C7Nz7D3IhDy6Gr5O4wu2PgVUY9_MtLc4QN6Ygx7AWfR7M9T0l3QUJyl4l8s6CuESLN3lNSvDsy8j3PVaLEgu0KqIXFWG7pG4vNmOlsCpawmk4Cbh0R2BbSXnddemKJLLpeFNa7obGfHa8erIsbDPizQWLR7bLb1VLJm4kHGj4G1hqcsiM7aCUtJuz0ET_3i0msTkQWGPLLM_dvkuv97rLzQkyNVfvkFcDKPZeh444qt1gWsCTCNH9iwV37zUw_L0_olmS9eng2GLRwfPUG_oWWps3mvnDAwEeqHEsaKRzJ2CYuyv8CRyayt7Akr1G3Ng");
        }
      },
    })
  );
}
