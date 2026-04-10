// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Root layout that bootstraps the app with global providers and
//          font loading. Wraps the entire app in gesture handler, safe area,
//          Redux store, and theme context. Defines the top-level Stack
//          navigator that includes the splash/index, register, forgot-password,
//          reset-password, and authenticated (auth) routes.
// ─────────────────────────────────────────────────────────────────────────────

// Root layout with providers
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '../src/store';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated splash calls during fast refresh.
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik: require('../assets/fonts/Rubik-Variable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide errors during fast refresh.
      });
    }
  }, [fontsLoaded]);

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
            <Toast />
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
