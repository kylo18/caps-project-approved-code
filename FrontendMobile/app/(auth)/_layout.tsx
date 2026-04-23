// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Authenticated routes wrapper. Provides a themed container with
//          the correct background color (light or dark) and renders child
//          routes via the Expo Router Slot component.
//          Also acts as a route guard — unauthenticated users are redirected
//          to the login screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { Redirect, Slot, useRouter } from 'expo-router'; import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../src/contexts/ThemeContext';
import { OfflineBanner } from '../../src/components/OfflineBanner';

export default function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const isAuthenticated = useSelector((state: any) => state.auth?.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#000' : '#f3f4f6' }}>
      <OfflineBanner />
      <Slot />
    </View>
  );
}
