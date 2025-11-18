import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@features": path.resolve(__dirname, "src/features"),
      "@landing": path.resolve(__dirname, "src/landingPage"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@schema": path.resolve(__dirname, "src/schema"),
      "@server": path.resolve(__dirname, "src/server"),
      "@types": path.resolve(__dirname, "src/types"),
      "@ui": path.resolve(__dirname, "src/ui"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
