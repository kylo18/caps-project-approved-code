// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Authenticated routes wrapper. Provides a themed container with
//          the correct background color (light or dark) and renders child
//          routes via the Expo Router Slot component.
// ─────────────────────────────────────────────────────────────────────────────

import { Redirect, Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
});
