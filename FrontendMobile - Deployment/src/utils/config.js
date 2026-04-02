// ============================================
// SERVER CONFIGURATION - CHANGE THESE TO UPDATE SERVER
// Author: Kimi Code CLI
// Last Updated: March 30, 2026
// Description: Centralized server configuration with automatic 
// environment detection for web vs APK builds
// ============================================

/**
 * Detects if the app is running inside a Capacitor native app (APK)
 * Checks for Capacitor object in window or specific user agent patterns
 * 
 * @returns {boolean} True if running in Capacitor native app
 */
const isCapacitor = () => {
  return typeof window !== 'undefined' && 
         (window.Capacitor !== undefined || 
          (window.navigator && window.navigator.userAgent && 
           window.navigator.userAgent.includes('Capacitor')));
};

/**
 * Detects if the app is in development mode
 * 
 * @returns {boolean} True if running in Vite development mode
 */
const isDev = () => {
  return import.meta.env.DEV === true;
};

// Single source of truth for server address
const DEFAULT_SERVER_IP = '100.112.226.110';
const SERVER_IP = import.meta.env.VITE_SERVER_IP || DEFAULT_SERVER_IP;
const API_PORT = import.meta.env.VITE_API_PORT || '8000';
const AI_PORT = import.meta.env.VITE_AI_PORT || '8001';
const TAILSCALE_SERVER = `http://${SERVER_IP}:${API_PORT}`;
const TAILSCALE_AI_SERVER = `http://${SERVER_IP}:${AI_PORT}`;

/**
 * Determines the default API server URL based on environment
 * For APK builds: Uses Tailscale server
 * For web builds: Uses Tailscale server (can be overridden by env)
 * 
 * @returns {string} The default server URL
 */
const getDefaultServer = () => {
  // Always use Tailscale server for all builds
  return TAILSCALE_SERVER;
};

/**
 * Retrieves any saved custom server URL from localStorage
 * Allows runtime server switching without rebuilding
 * 
 * @returns {string|null} Saved server URL or null if not set
 */
const getSavedServer = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('apiBaseUrl');
  } catch (e) {
    return null;
  }
};

/**
 * Returns the active backend API URL
 * Priority: 1. Saved localStorage URL, 2. Env variable, 3. Default (Tailscale)
 * This is the main function used throughout the app for API calls
 * 
 * @returns {string} The active API base URL
 */
export const getApiUrl = () => {
  const savedUrl = getSavedServer();
  const envUrl = import.meta.env.VITE_API_SERVER;
  const defaultUrl = getDefaultServer();
  
  return savedUrl || envUrl || defaultUrl;
};

/**
 * Returns the AI microservice URL for local/offline inference
 * 
 * @returns {string} The AI service URL
 */
export const getAiServiceUrl = () => {
  return import.meta.env.VITE_AI_SERVICE_URL || TAILSCALE_AI_SERVER;
};

/**
 * Legacy alias for getApiUrl()
 * Maintains backward compatibility with older code
 * 
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  return getApiUrl();
};

/**
 * Checks if API configuration is available
 * Always returns true since we now have built-in defaults
 * 
 * @returns {boolean} Always true
 */
export const hasApiConfig = () => {
  return true;
};

/**
 * Saves a custom API URL to localStorage for runtime switching
 * 
 * @param {string} url - The custom API URL to save
 * @returns {string} The saved URL
 */
export const setApiBaseUrl = (url) => {
  if (typeof window === 'undefined') return url;
  try {
    localStorage.setItem('apiBaseUrl', url);
    return url;
  } catch (e) {
    console.error('Failed to save API URL:', e);
    return url;
  }
};

/**
 * Clears any saved custom API URL from localStorage
 * After clearing, the app will fall back to default server
 */
export const clearApiConfig = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('apiBaseUrl');
  } catch (e) {
    console.error('Failed to clear API config:', e);
  }
};

/**
 * Returns debug information about the current configuration
 * Useful for troubleshooting connection issues
 * 
 * @returns {Object} Debug info including current URL, environment, and user agent
 */
export const getDebugInfo = () => {
  return {
    isCapacitor: isCapacitor(),
    isDev: isDev(),
    serverIp: SERVER_IP,
    currentUrl: getApiUrl(),
    savedUrl: getSavedServer(),
    envUrl: import.meta.env.VITE_API_SERVER,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
  };
};

export default getApiUrl;
