// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Root layout that bootstraps the app with global providers and
//          font loading. Wraps the entire app in gesture handler, safe area,
//          Redux store, and theme context. Defines the top-level Stack
//          navigator that includes the splash/index, register, forgot-password,
//          reset-password, and authenticated (auth) routes.
// ─────────────────────────────────────────────────────────────────────────────

// Root layout with providers
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { store } from '../src/store';
import { logout } from '../src/store/slices/authSlice';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { toastConfig } from '../src/hooks/useToast';
import { syncOfflineQueue, registerUnauthorizedCallback } from '../src/services/apiClient';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  registerForPushNotificationsAsync,
  registerPushTokenWithBackend,
  resolveNotificationActionUrl,
  setNotificationHandler,
} from '../src/services/notificationService';
import '../global.css';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated splash calls during fast refresh.
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    registerUnauthorizedCallback(() => {
      store.dispatch(logout());
      router.replace('/');
    });
  }, [router]);

  const [fontsLoaded] = useFonts({
    Rubik: require('../assets/fonts/Rubik-Variable.ttf'),
  });
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide errors during fast refresh.
      });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected ?? true;
      if (wasOfflineRef.current && isOnline) {
        syncOfflineQueue().catch(() => {
          // Ignore sync errors — toast is handled inside syncOfflineQueue
        });
      }
      wasOfflineRef.current = !isOnline;
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Skip push notifications in Expo Go — not supported on Android SDK 53+
    if (isExpoGo) return;

    let unsubscribeReceived: (() => void) | undefined;
    let unsubscribeResponse: (() => void) | undefined;

    const bootstrapNotifications = async () => {
      await setNotificationHandler();

      const authToken = await SecureStore.getItemAsync('token');
      const result = await registerForPushNotificationsAsync();
      if (authToken && result.token) {
        await registerPushTokenWithBackend(result.token);
      }

      unsubscribeReceived = await addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      unsubscribeResponse = await addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, any>;
        const actionUrl =
          (typeof data?.actionUrl === 'string' ? data.actionUrl : null) ||
          resolveNotificationActionUrl(String(data?.type ?? ''), data);

        if (actionUrl) {
          router.push(actionUrl as any);
        }
      });
    };

    bootstrapNotifications().catch((error) => {
      console.error('Notification bootstrap failed:', error);
    });

    return () => {
      unsubscribeReceived?.();
      unsubscribeResponse?.();
    };
  }, [router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="register" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
