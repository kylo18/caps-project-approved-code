// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Offline caching and mutation queueing service using AsyncStorage.
//
// Features:
// - Cache successful GET responses with TTL
// - Retrieve cached data when offline
// - Queue mutations (POST/PUT/PATCH/DELETE) when offline
// - Clear cache and queue
// - StorageManager: LRU eviction, per-key & global size limits
//   to prevent SQLite_FULL errors
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:';
const OFFLINE_QUEUE_KEY = 'offline_queue';
const STORAGE_META_KEY = '@storage_meta';

// ── Storage Manager ───────────────────────────────────────────────────────────
// Prevents AsyncStorage from growing unbounded by enforcing per-key and global
// size limits using an LRU eviction policy.

const MAX_KEY_SIZE = 500 * 1024;       // 500 KB per entry
const MAX_TOTAL_SIZE = 2 * 1024 * 1024; // 2 MB across all managed keys
const MAX_KEY_COUNT = 100;             // Max number of managed cache entries
const MAX_OFFLINE_QUEUE = 20;          // Max queued offline mutations

interface StorageMeta {
  [key: string]: {
    size: number;        // byte length of serialized value
    lastAccessed: number; // Date.now() timestamp — used for LRU eviction
  };
}

const _metaCache: { meta: StorageMeta | null; dirty: boolean } = {
  meta: null,
  dirty: false,
};

async function loadMeta(): Promise<StorageMeta> {
  if (_metaCache.meta !== null) return _metaCache.meta;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_META_KEY);
    _metaCache.meta = raw ? JSON.parse(raw) : {};
  } catch {
    _metaCache.meta = {};
  }
  return _metaCache.meta as StorageMeta;
}

async function saveMeta(): Promise<void> {
  if (!_metaCache.dirty) return;
  try {
    await AsyncStorage.setItem(STORAGE_META_KEY, JSON.stringify(_metaCache.meta));
    _metaCache.dirty = false;
  } catch {
    // Best-effort
  }
}

/**
 * Evict least-recently-accessed entries until `neededSpace` bytes are freed.
 * Operates only on the keys tracked in the storage meta.
 */
async function evictLRU(neededSpace: number): Promise<void> {
  const meta = await loadMeta();
  const entries = Object.entries(meta);

  // Sort oldest-first by lastAccessed
  entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

  let freedSpace = 0;
  const toRemove: string[] = [];

  for (const [key, entry] of entries) {
    if (freedSpace >= neededSpace) break;
    toRemove.push(key);
    freedSpace += entry.size + key.length * 2; // rough UTF-16 estimate
  }

  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
    toRemove.forEach((k) => delete _metaCache.meta![k]);
    _metaCache.dirty = true;
    await saveMeta();
  }
}

/**
 * Called before writing a new value. Enforces MAX_KEY_SIZE, MAX_TOTAL_SIZE,
 * and MAX_KEY_COUNT. Evicts LRU entries if necessary.
 */
async function enforceStorageLimits(
  key: string,
  valueSize: number
): Promise<void> {
  if (valueSize > MAX_KEY_SIZE) {
    // Single entry too large — skip caching entirely
    return;
  }

  const meta = await loadMeta();
  const currentTotal = Object.values(meta).reduce((sum, e) => sum + e.size, 0);
  const currentCount = Object.keys(meta).length;

  // Need to evict?
  const needsSpace = valueSize > MAX_TOTAL_SIZE - currentTotal;
  const needsCount = currentCount >= MAX_KEY_COUNT && !(key in meta);

  if (needsSpace || needsCount) {
    const needed = needsSpace ? valueSize : 1; // evict at least one entry for count
    await evictLRU(needed);
  }
}

async function registerKey(key: string, size: number): Promise<void> {
  const meta = await loadMeta();
  meta[key] = { size, lastAccessed: Date.now() };
  _metaCache.meta = meta;
  _metaCache.dirty = true;
  await saveMeta();
}

async function touchKey(key: string): Promise<void> {
  const meta = await loadMeta();
  if (meta[key]) {
    meta[key].lastAccessed = Date.now();
    _metaCache.meta = meta;
    _metaCache.dirty = true;
    await saveMeta();
  }
}

async function removeKey(key: string): Promise<void> {
  const meta = await loadMeta();
  if (meta[key]) {
    delete meta[key];
    _metaCache.meta = meta;
    _metaCache.dirty = true;
    await saveMeta();
  }
}

/**
 * Returns storage usage info for the managed cache.
 */
export async function getStorageInfo(): Promise<{
  keyCount: number;
  totalSizeMB: string;
  isNearFull: boolean;
}> {
  const meta = await loadMeta();
  const totalSize = Object.values(meta).reduce((sum, e) => sum + e.size, 0);
  return {
    keyCount: Object.keys(meta).length,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    isNearFull: totalSize > MAX_TOTAL_SIZE * 0.8,
  };
}

// ── Cache types ───────────────────────────────────────────────────────────────

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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${CACHE_PREFIX}${method}:${normalizedPath}`;
}

export async function setCachedResponse(
  key: string,
  data: unknown,
  ttlMs: number = 5 * 60 * 1000
): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    const size = serialized.length;

    await enforceStorageLimits(key, size);

    const item: CachedItem = { data, expiresAt: Date.now() + ttlMs };
    await AsyncStorage.setItem(key, JSON.stringify(item));
    await registerKey(key, size);
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
      await removeKey(key);
      return null;
    }
    // Touch for LRU ordering
    await touchKey(key);
    return item.data;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX) || k === 'my_classes_cache');
    await AsyncStorage.multiRemove(cacheKeys);
    // Reset storage meta
    _metaCache.meta = {};
    _metaCache.dirty = true;
    await saveMeta();
  } catch {
    // Ignore cleanup errors
  }
}

// ── Offline Queue ─────────────────────────────────────────────────────────────
// Bounded queue: keeps at most MAX_OFFLINE_QUEUE items; extra mutations are
// dropped rather than accumulating indefinitely.

export async function addToOfflineQueue(
  request: Omit<QueuedRequest, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const entry: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    queue.push(entry);
    // Enforce max queue size — keep the newest entries
    const trimmed = queue.length > MAX_OFFLINE_QUEUE
      ? queue.slice(queue.length - MAX_OFFLINE_QUEUE)
      : queue;
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
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

// ── Orphaned Exam Key Cleanup ──────────────────────────────────────────────────

const EXAM_KEY_PREFIX = 'exam_';
const ORPHAN_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function cleanupOrphanedExamKeys(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const examKeys = allKeys.filter((k) => k.startsWith(EXAM_KEY_PREFIX));

    if (examKeys.length === 0) return;

    const staleKeys: string[] = [];

    // Read all exam values in one shot to check timestamps
    const pairs = await AsyncStorage.multiGet(examKeys);
    for (const [key, raw] of pairs) {
      try {
        const parsed = JSON.parse(raw || '{}');
        if (parsed.timestamp && Date.now() - parsed.timestamp > ORPHAN_THRESHOLD_MS) {
          staleKeys.push(key);
        }
      } catch {
        // Malformed entry — treat as stale
        staleKeys.push(key);
      }
    }

    if (staleKeys.length > 0) {
      await AsyncStorage.multiRemove(staleKeys);
    }
  } catch {
    // Best-effort
  }
}