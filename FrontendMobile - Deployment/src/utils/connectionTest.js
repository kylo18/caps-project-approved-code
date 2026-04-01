/**
 * Connection Test Utility
 * Helps diagnose network connectivity issues in the APK
 * Author: Kimi Code CLI
 * Last Updated: March 30, 2026
 */

import { getApiUrl, getDebugInfo } from './config.js';

/**
 * Performs connection tests to diagnose backend connectivity
 * Tests health endpoint, API ping, and checks Capacitor environment
 * 
 * @returns {Promise<Object>} Test results with timestamp, config, and test details
 */
export const testConnection = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    config: getDebugInfo(),
    tests: []
  };

  const apiUrl = getApiUrl();
  
  // Test 1: Basic fetch to health endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    results.tests.push({
      name: 'Backend Health Check',
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    results.tests.push({
      name: 'Backend Health Check',
      success: false,
      error: error.message,
      type: error.name
    });
  }

  // Test 2: Simple ping (no auth required)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const startTime = Date.now();
    const response = await fetch(`${apiUrl}/api/test`, {
      method: 'GET',
      signal: controller.signal
    });
    const endTime = Date.now();
    
    clearTimeout(timeoutId);
    
    results.tests.push({
      name: 'API Ping',
      success: response.ok,
      latency: `${endTime - startTime}ms`,
      status: response.status
    });
  } catch (error) {
    results.tests.push({
      name: 'API Ping',
      success: false,
      error: error.message
    });
  }

  // Test 3: Check if Capacitor HTTP plugin is available
  results.tests.push({
    name: 'Capacitor Environment',
    isCapacitor: typeof window !== 'undefined' && window.Capacitor !== undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
  });

  return results;
};

/**
 * Analyzes test results and returns human-readable connection status
 * Provides specific error messages based on the type of failure
 * 
 * @param {Object} testResults - Results from testConnection()
 * @returns {Object} Status object with status type, message, and details
 */
export const getConnectionStatus = (testResults) => {
  if (!testResults || !testResults.tests) {
    return { status: 'unknown', message: 'No test results available' };
  }

  const healthCheck = testResults.tests.find(t => t.name === 'Backend Health Check');
  
  if (!healthCheck) {
    return { status: 'error', message: 'Health check not performed' };
  }

  if (healthCheck.success) {
    return { 
      status: 'connected', 
      message: 'Successfully connected to backend',
      details: healthCheck
    };
  }

  // Analyze common errors
  if (healthCheck.error) {
    if (healthCheck.error.includes('Failed to fetch') || healthCheck.error.includes('NetworkError')) {
      return {
        status: 'network_error',
        message: 'Cannot reach server. Check: 1) Internet connection, 2) Server is running, 3) IP address is correct',
        details: healthCheck
      };
    }
    
    if (healthCheck.error.includes('CORS') || healthCheck.error.includes('blocked')) {
      return {
        status: 'cors_error',
        message: 'CORS policy blocked the request. Server configuration issue.',
        details: healthCheck
      };
    }
    
    if (healthCheck.error.includes('timeout') || healthCheck.type === 'AbortError') {
      return {
        status: 'timeout',
        message: 'Connection timed out. Server may be slow or unreachable.',
        details: healthCheck
      };
    }
  }

  return {
    status: 'error',
    message: `Connection failed: ${healthCheck.error || healthCheck.statusText || 'Unknown error'}`,
    details: healthCheck
  };
};

export default testConnection;
