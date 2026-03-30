import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: process.env.VITE_API_SERVER || 'http://localhost:8005',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',

  },
});
