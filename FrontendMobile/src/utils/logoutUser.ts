// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Single centralized logout utility.
// All logout side effects (SecureStore, push token unregister) live here.
// Redux reducers remain pure — this file handles all persistence.
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import { unregisterStoredPushToken } from '../services/pushNotificationService';

/** All auth keys written/read during login and logout */
const AUTH_KEYS = ['token', 'user', 'rememberMe', 'biometricEnabled', 'pushToken'] as const;

/** Clears every auth-related SecureStore key and unregisters push token */
export async function clearAuthStorage(): Promise<void> {
  await Promise.all([
    ...AUTH_KEYS.map((key) => SecureStore.deleteItemAsync(key)),
    unregisterStoredPushToken().catch(() => {}),
  ]);
}

/**
 * The single logout function. Clears all stored credentials,
 * unregisters the push token, and returns true on success.
 * Call this from any component, then dispatch Redux `logout()` separately.
 */
export async function logoutUser(): Promise<void> {
  await clearAuthStorage();
}

export default logoutUser;