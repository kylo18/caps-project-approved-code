// ─────────────────────────────────────────────────────────────────────────────
// Program Chair tab-based navigation layout.
//
// Role guard: handled in parent AuthLayout via usePathname().
//             Role mismatches redirect via getDashboardRoute().
// ─────────────────────────────────────────────────────────────────────────────

import { Tabs } from 'expo-router';
import { View } from 'react-native';
import RoleTabBar from '../../../src/features/core/components/RoleTabBar';
import AdminFloatingTools from '../../../src/features/admin/shared/components/AdminFloatingTools';
import { FloatingToolsProvider, useFloatingToolsState } from '../../../src/contexts/FloatingToolsContext';

function ProgramChairFloatingTools() {
  const { actions, visible } = useFloatingToolsState();
  return <AdminFloatingTools actions={actions} visible={visible} />;
}

export default function ProgramChairLayout() {
  return (
    <FloatingToolsProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => (
            <RoleTabBar {...props} visibleRoutes={['dashboard', 'subjects', 'classes', 'insights', 'profile']} />
          )}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
          <Tabs.Screen name="subjects" options={{ title: 'Subjects' }} />
          <Tabs.Screen name="classes" options={{ title: 'Classes' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          <Tabs.Screen name="users" options={{ href: null }} />
          <Tabs.Screen name="create-announcement" options={{ href: null }} />
          <Tabs.Screen name="class-detail" options={{ href: null }} />
          <Tabs.Screen name="reports" options={{ href: null }} />
          <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
          <Tabs.Screen name="archived-classes" options={{ href: null }} />
        </Tabs>
        <ProgramChairFloatingTools />
      </View>
    </FloatingToolsProvider>
  );
}
