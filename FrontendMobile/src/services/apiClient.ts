import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import {
  cacheKey,
  setCachedResponse,
  getCachedResponse,
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearCache,
} from './cacheService';
import { showToast } from '../hooks/useToast';

const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://100.91.44.24:8000';

function buildUrl(path: string) {
  const baseUrl = API_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function rawApiRequest(
  path: string,
  { method = 'GET', body, auth = true }: { method?: string; body?: any; auth?: boolean } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (auth) {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest(
  path: string,
  { method = 'GET', body, auth = true }: { method?: string; body?: any; auth?: boolean } = {}
) {
  const net = await NetInfo.fetch();
  const isOnline = net.isConnected ?? true;
  const key = cacheKey(method, path);

  if (isOnline) {
    try {
      const result = await rawApiRequest(path, { method, body, auth });
      if (method === 'GET') {
        // Cache static-ish data for 24h, dynamic data for 5m
        const ttl = path.includes('/count') || path.includes('/subjects')
          ? 24 * 60 * 60 * 1000
          : 5 * 60 * 1000;
        await setCachedResponse(key, result, ttl);
      }
      return result;
    } catch (error: any) {
      // If the error looks like a network failure, try cache fallback for GET
      if (method === 'GET' && (error.message?.includes('Network') || error.status >= 500)) {
        const cached = await getCachedResponse(key);
        if (cached !== null) {
          showToast('Showing cached data — server unreachable.', 'info');
          return cached;
        }
      }
      throw error;
    }
  }

  // Offline handling
  if (method === 'GET') {
    const cached = await getCachedResponse(key);
    if (cached !== null) {
      return cached;
    }
    throw new Error('You are offline. This data is not available.');
  }

  // Queue mutations for later sync
  await addToOfflineQueue({ path, method, body, auth });
  showToast('You are offline. This action will sync when you reconnect.', 'info');
  return { queued: true, message: 'Will sync when online' };
}

export async function syncOfflineQueue(): Promise<void> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (const item of queue) {
    try {
      await rawApiRequest(item.path, {
        method: item.method,
        body: item.body,
        auth: item.auth,
      });
      await removeFromOfflineQueue(item.id);
      successCount++;
    } catch {
      failCount++;
    }
  }

  if (successCount > 0 && failCount === 0) {
    showToast('Offline changes synced successfully.', 'success');
  } else if (failCount > 0) {
    showToast(`${failCount} offline change(s) could not be synced.`, 'error');
  }
}

export { clearCache };

// Keep axios client for backwards compatibility
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
