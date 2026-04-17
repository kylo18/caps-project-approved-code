// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Authenticated routes wrapper. Provides a themed container with
//          the correct background color (light or dark) and renders child
//          routes via the Expo Router Slot component.
// ─────────────────────────────────────────────────────────────────────────────

import { Redirect, Slot } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { OfflineBanner } from '../../src/components/OfflineBanner';

export default function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#000' : '#f3f4f6' }}>
      <OfflineBanner />
      <Slot />
    </View>
  );
}
