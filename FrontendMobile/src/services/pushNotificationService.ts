// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Push notification client-side plumbing using expo-notifications.
//
// Features:
// - Request notification permissions
// - Get Expo push token
// - Set up foreground/background notification listeners
// - Register push token with backend
// ─────────────────────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiRequest } from './apiClient';

const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://100.91.44.24:8000';

export interface PushTokenResult {
  token: string | null;
  status: 'granted' | 'denied' | 'not-supported';
}

/**
 * Request notification permissions and return the Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
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

/**
 * Configure default notification handler for foreground notifications.
 */
export function setNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
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
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add notification response listener (user taps notification). Returns unsubscribe function.
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}
