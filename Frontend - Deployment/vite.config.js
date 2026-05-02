import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

const useHttps =
  process.env.HTTPS === "1" || process.env.HTTPS === "true";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(useHttps ? [basicSsl()] : []),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        id: "/",
        name: "Caps",
        short_name: "CAPS JRMSU",
        description:
          "CAPS JRMSU is the Comprehensive Assessment and Preparation System for JRMSU students.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/index.html"],
        // SPA shell so the SW handles navigations (Chrome often needs this for installability).
        navigateFallback: "index.html",
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      // Required for `beforeinstallprompt` during `npm run dev` (SW + manifest must be active).
      devOptions: {
        enabled: true,
        disableRuntimeConfig: true,
        suppressWarnings: true,
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
  },
});
