// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Push notification client-side plumbing using expo-notifications.
//
// Features:
// - Request notification permissions
// - Get Expo push token
// - Set up foreground/background notification listeners
// - Register push token with backend
// ─────────────────────────────────────────────────────────────────────────────

import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiRequest } from './apiClient';

const PUSH_TOKEN_STORAGE_KEY = 'pushToken';
const isExpoGo = Constants.executionEnvironment === 'storeClient';

type ExpoNotificationsModule = typeof import('expo-notifications');
type ExpoNotification = Awaited<
  ReturnType<ExpoNotificationsModule['getLastNotificationResponseAsync']>
> extends { notification: infer T }
  ? T
  : unknown;
type ExpoNotificationResponse = Awaited<
  ReturnType<ExpoNotificationsModule['getLastNotificationResponseAsync']>
>;

export interface PushTokenResult {
  token: string | null;
  status: 'granted' | 'denied' | 'not-supported';
}

async function getNotificationsModule(): Promise<ExpoNotificationsModule | null> {
  if (isExpoGo) {
    return null;
  }

  return import('expo-notifications');
}

/**
 * Request notification permissions and return the Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return { token: null, status: 'not-supported' };
  }

  if (!Device.isDevice) {
    return { token: null, status: 'not-supported' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { token: null, status: 'denied' };
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FE6902',
    });
  }

  await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, tokenData.data);

  return { token: tokenData.data, status: 'granted' };
}

/**
 * Register the push token with the backend so the server can send notifications.
 */
export async function registerPushTokenWithBackend(token: string): Promise<void> {
  try {
    await apiRequest('/api/push-token', {
      method: 'POST',
      body: { token, platform: Platform.OS },
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

/**
 * Remove the push token from the backend (e.g., on logout).
 */
export async function unregisterPushTokenWithBackend(token: string): Promise<void> {
  try {
    await apiRequest('/api/push-token', {
      method: 'DELETE',
      body: { token },
    });
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

export async function unregisterStoredPushToken(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
    if (token) {
      await unregisterPushTokenWithBackend(token);
    }
  } catch (error) {
    console.error('Failed to remove stored push token from backend:', error);
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
  }
}

/**
 * Configure default notification handler for foreground notifications.
 */
export async function setNotificationHandler(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Add notification received listener. Returns unsubscribe function.
 */
export async function addNotificationReceivedListener(
  callback: (notification: ExpoNotification) => void
): Promise<() => void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return () => {};
  }

  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add notification response listener (user taps notification). Returns unsubscribe function.
 */
export async function addNotificationResponseReceivedListener(
  callback: (response: ExpoNotificationResponse) => void
): Promise<() => void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return () => {};
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}
