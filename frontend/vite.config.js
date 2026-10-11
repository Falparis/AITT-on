import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev server proxies `/api` to the local backend (Express on :4000) so the SPA
// can use a same-origin relative base URL (VITE_API_BASE_URL=/api/v1) and avoid
// CORS in dev. Override the backend target with BACKEND_ORIGIN if it differs.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:4000";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
    },
  },
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
});
