import "./pwaDeferredInstall.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/index.css";
import App from "./App.jsx";
import "./i18n.js";

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
    <App />
  </StrictMode>,
);
