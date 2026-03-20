// ============================================
// API BASE CONFIGURATION (supports runtime override)
// ============================================

const API_BASE_URL_KEY = "apiBaseUrl";
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Ensures a base URL always ends with "/api" (no trailing slash).
export const normalizeApiBaseUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

// Removes a trailing "/api" (used for display inputs).
export const stripApiBaseUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
};

// Returns the active backend base URL used by frontend requests.
export const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
  }

  const stored = localStorage.getItem(API_BASE_URL_KEY);
  const normalized = normalizeApiBaseUrl(stored || DEFAULT_API_BASE_URL);

  // Normalize any legacy stored value.
  if (stored && stored !== normalized) {
    localStorage.setItem(API_BASE_URL_KEY, normalized);
  }

  return normalized;
};

// Backwards-compatible helper name (returns base without /api).
export const getApiUrl = () => stripApiBaseUrl(getApiBaseUrl());

// Server setup is always available because defaults exist.
export const hasApiConfig = () => Boolean(getApiBaseUrl());

// Stores a local-network server target using an IP and port pair.
export const setApiBaseUrl = (ip, port) => {
  const base = `http://${ip}:${port}`;
  const normalized = normalizeApiBaseUrl(base);
  localStorage.setItem(API_BASE_URL_KEY, normalized);
  return normalized;
};

// Stores a fully custom backend URL without rebuilding the app.
export const setCustomApiUrl = (url) => {
  const normalized = normalizeApiBaseUrl(url);
  localStorage.setItem(API_BASE_URL_KEY, normalized);
  return normalized;
};

// Clears the saved backend override so the default server is used again.
export const clearApiConfig = () => {
  localStorage.removeItem(API_BASE_URL_KEY);
};
