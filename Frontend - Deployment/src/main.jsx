import "./pwaDeferredInstall.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/index.css";
import App from "./App.jsx";
import "./i18n.js";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

registerSW({
  immediate: true,
  onRegisteredSW() {
    window.dispatchEvent(new CustomEvent("pwa-sw-ready"));
  },
  onRegisterError(err) {
    console.warn("[PWA] Service worker registration failed:", err);
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
