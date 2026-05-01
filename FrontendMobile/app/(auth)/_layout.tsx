// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Authenticated routes wrapper. Provides a themed container with
//          the correct background color (light or dark) and renders child
//          routes via the Expo Router Slot component.
//          Also acts as a route guard — unauthenticated users are redirected
//          to the login screen, and users at the wrong role layout are
//          redirected to their correct dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { Redirect, Slot, usePathname } from 'expo-router';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../src/contexts/ThemeContext';
import { OfflineBanner } from '../../src/features/core/components/OfflineBanner';
import { getDashboardRoute } from '../../src/utils/roleValidation';
import type { RootState } from '../../src/store';

const ROUTE_ROLE_MAP: Record<string, number> = {
  dean: 5,
  'associate-dean': 4,
  'program-chair': 3,
  faculty: 2,
  student: 1,
};

export default function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated);
  const roleID = useSelector((state: RootState) => state.auth.user?.roleID);

  // Guard: unauthenticated users go to login
  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  // Guard: wrong role layout → redirect to correct dashboard
  // pathname is like /(auth)/(dean)/dashboard — extract the role segment from it.
  // Pattern: /auth/<roleGroup>/... where roleGroup is dean, student, etc.
  const authIndex = pathname.indexOf('/(auth)/');
  let intendedRole: number | null = null;
  if (authIndex !== -1) {
    const afterAuth = pathname.slice(authIndex + 8); // skip "/(auth)/"
    const endIdx = afterAuth.indexOf(')');
    if (endIdx !== -1) {
      const roleGroup = afterAuth.slice(0, endIdx).replace(/^\(|\)$/g, '');
      intendedRole = ROUTE_ROLE_MAP[roleGroup] ?? null;
    }
  }

  if (roleID !== undefined && intendedRole !== null && roleID !== intendedRole) {
    return <Redirect href={getDashboardRoute(roleID)} />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#000' : '#f3f4f6' }}>
      <OfflineBanner />
      <Slot />
    </View>
  );
}