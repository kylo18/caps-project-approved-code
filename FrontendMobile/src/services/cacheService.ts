// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Offline caching and mutation queueing service using AsyncStorage.
//
// Features:
// - Cache successful GET responses with TTL
// - Retrieve cached data when offline
// - Queue mutations (POST/PUT/PATCH/DELETE) when offline
// - Clear cache and queue
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:';
const OFFLINE_QUEUE_KEY = 'offline_queue';

interface CachedItem {
  data: unknown;
  expiresAt: number;
}

interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body?: unknown;
  auth: boolean;
  timestamp: number;
}

export function cacheKey(method: string, path: string): string {
  // Include full path + query string so different filter params get separate cache entries
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${CACHE_PREFIX}${method}:${normalizedPath}`;
}

export async function setCachedResponse(
  key: string,
  data: unknown,
  ttlMs: number = 5 * 60 * 1000 // default 5 minutes
): Promise<void> {
  try {
    const item: CachedItem = { data, expiresAt: Date.now() + ttlMs };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch {
    // Silently ignore cache write failures (e.g. disk full)
  }
}

export async function getCachedResponse(key: string): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const item: CachedItem = JSON.parse(raw);
    if (Date.now() > item.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {
    // Ignore cleanup errors
  }
}

export async function addToOfflineQueue(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const entry: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    queue.push(entry);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Silently ignore queue write failures
  }
}

export async function getOfflineQueue(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore cleanup errors
  }
}
