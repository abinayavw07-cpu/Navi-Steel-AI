import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // Forward /api/* calls to Express so the React dev server avoids CORS issues
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
