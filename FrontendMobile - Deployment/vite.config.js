import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      watch: {
        // Ignore native Android/llama.cpp source trees that contain unrelated HTML/JS entrypoints.
        ignored: ["**/android/**", "**/dist/**"],
      },
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              const authHeader = req.headers.authorization;
              if (authHeader) {
                proxyReq.setHeader("Authorization", authHeader);
              }
            });
          },
        },
      },
    },
    optimizeDeps: {
      // Restrict dependency crawling to the actual web app instead of every HTML file in the repo.
      entries: ["index.html", "src/**/*.{js,jsx,ts,tsx}"],
      // Exclude packages that are only used in native android/ios code
      exclude: ["node-fetch"],
    },
    build: {
      outDir: "dist",
    },
  };
});
