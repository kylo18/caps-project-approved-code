// ============================================
// SERVER CONFIGURATION - CHANGE THESE TO UPDATE SERVER
// ============================================

const DEFAULT_TEST_SERVER = import.meta.env.VITE_API_SERVER || 'http://18.142.190.113:8000';

// Returns the active backend base URL used by frontend requests.
export const getApiUrl = () => {
  return DEFAULT_TEST_SERVER;
};

// Keeps the old helper name working while all callers use the same source.
export const getApiBaseUrl = () => {
  return getApiUrl();
};

// Server setup is always available because the app now uses a fixed backend.
export const hasApiConfig = () => {
  return true;
};
