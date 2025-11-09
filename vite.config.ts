import { defineConfig } from "vite";

// export default defineConfig({
//   plugins: [react(), tailwind()],
//   server: {
//     port: 3000,
//     strictPort: true,
//     strictPort: true,
//     proxy: {
//       "/api": {
//         target: "http://localhost:5175",
//         changeOrigin: true,
//       },
//     },
//   },
//   preview: { port: 5000 },
// });

export default defineConfig({
  // ...
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5175", // try 127.0.0.1 to dodge IPv6 funkiness
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (_req, req) => {
            console.log("[proxy] →", req.method, req.url);
          });
          proxy.on("proxyRes", (res, req) => {
            console.log("[proxy] ←", req.method, req.url, res.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] ✖", req.method, req.url, err.message);
          });
        },
      },
    },
  },
});
