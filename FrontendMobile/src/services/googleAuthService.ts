// Google Authentication Service
// Mobile: opens the backend OAuth redirect in expo-web-browser and intercepts the callback.
// Web:    opens a popup to the backend redirect and listens for postMessage with the token.

import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { User } from '../types';

const API_URL = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL || '';
const REDIRECT_URL = 'caps://auth/google/callback';

function extractSocialToken(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('social_token');
  } catch {
    return null;
  }
}

function extractSocialError(url: string): { code: string; message: string } | null {
  try {
    const urlObj = new URL(url);
    const error = urlObj.searchParams.get('social_error');
    if (error) {
      return {
        code: error,
        message: urlObj.searchParams.get('message') || 'Google sign in failed',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Mobile Google sign-in via backend OAuth redirect.
 * Opens the browser, lets the user authenticate with Google, and the backend
 * redirects back to caps://auth/google/callback?social_token=...
 */
export async function signInWithGoogleMobile(): Promise<{
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}> {
  if (Platform.OS === 'web') {
    return {
      success: false,
      error: 'Mobile sign-in is not available on web. Use the popup flow instead.',
    };
  }

  try {
    const authUrl =
      `${API_URL}/api/auth/google/redirect?frontend_url=${encodeURIComponent(REDIRECT_URL)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URL);

    if (result.type !== 'success') {
      return {
        success: false,
        error: result.type === 'cancel' ? 'Sign in was cancelled' : 'Google sign in failed',
      };
    }

    const err = extractSocialError(result.url);
    if (err) {
      return { success: false, error: err.message };
    }

    const token = extractSocialToken(result.url);
    if (!token) {
      return { success: false, error: 'No authentication token received from server' };
    }

    return { success: true, token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during Google sign in',
    };
  }
}

/**
 * Web Google sign-in via popup.
 * The backend redirects to a frontend page that posts the token back via postMessage.
 */
export async function signInWithGooglePopup(): Promise<{
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}> {
  if (Platform.OS !== 'web') {
    return {
      success: false,
      error: 'Popup sign-in is only available on web.',
    };
  }

  try {
    const popup = window.open(
      `${API_URL}/api/auth/google/redirect`,
      'googleSignIn',
      'width=500,height=600'
    );

    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          resolve({ success: false, error: 'Popup was closed before completing sign in' });
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== API_URL) return;
        if (event.data?.social_token) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          resolve({ success: true, token: event.data.social_token });
        }
        if (event.data?.social_error) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          resolve({ success: false, error: event.data.message || 'Google sign in failed' });
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        popup?.close();
        resolve({ success: false, error: 'Sign in timed out' });
      }, 120000);
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Popup sign-in failed' };
  }
}

/**
 * Stub hook to keep the component API stable.
 * On mobile the auth request is prepared on-the-fly inside signInWithGoogleMobile,
 * so there is no async "request loading" state to wait for.
 */
export function useGoogleAuth() {
  return {
    request: { url: '' } as { url: string },
    signInWithGoogle: signInWithGoogleMobile,
  };
}
