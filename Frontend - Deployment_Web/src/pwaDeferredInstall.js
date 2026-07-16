/**
 * Keeps the deferred install prompt outside React so Strict Mode remounts
 * don't drop the BeforeInstallPromptEvent reference.
 */
let deferredPrompt = null;

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent("pwa-deferred-ready"));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa-deferred-ready"));
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(() => {
      window.dispatchEvent(new CustomEvent("pwa-sw-ready"));
    });
  }

  window.addEventListener("pwa-sw-ready", () => {
    window.dispatchEvent(new CustomEvent("pwa-deferred-ready"));
  });
}
