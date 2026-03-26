// ============================================
// SERVER CONFIGURATION - CHANGE THESE TO UPDATE SERVER
// ============================================

const DEFAULT_LOCAL_SERVER = 'http://100.91.44.24:8005';
const DEFAULT_TEST_SERVER = import.meta.env.VITE_API_SERVER || 'http://18.142.190.113:8000';
const USE_TEST_SERVER = true;

const API_BASE_URL_KEY = 'apiBaseUrl';

// Reads the saved API base URL and falls back to the selected default server.
const getStoredApiUrl = () => {
  // 1. Prioritize Test Server Flag
  if (USE_TEST_SERVER) {
    // Check if we need to clean up stale local data ONCE to avoid redundant writes
    if (typeof window !== 'undefined' && localStorage.getItem(API_BASE_URL_KEY)) {
      localStorage.removeItem(API_BASE_URL_KEY);
    }
    return DEFAULT_TEST_SERVER;
  }

  // 2. Local/Dev Mode Fallback
  if (typeof window === 'undefined') return DEFAULT_LOCAL_SERVER;
  
  // Return stored IP (for dev override) or the default local IP
  return localStorage.getItem(API_BASE_URL_KEY) || DEFAULT_LOCAL_SERVER;
};

// Returns the active backend base URL used by frontend requests.
export const getApiUrl = () => {
  return getStoredApiUrl();
};

// Keeps the old helper name working while all callers use the same source.
export const getApiBaseUrl = () => {
  return getApiUrl();
};

// Server setup is now always considered available because the app ships with defaults.
export const hasApiConfig = () => {
  return true;
};

// Stores a local-network server target using an IP and port pair.
export const setApiBaseUrl = (ip, port) => {
  const url = `http://${ip}:${port}`;
  localStorage.setItem(API_BASE_URL_KEY, url);
  return url;
};

// Stores a fully custom backend URL without rebuilding the app.
export const setCustomApiUrl = (url) => {
  localStorage.setItem(API_BASE_URL_KEY, url);
  return url;
};

// Clears the saved backend override so the default server is used again.
export const clearApiConfig = () => {
  localStorage.removeItem(API_BASE_URL_KEY);
};
