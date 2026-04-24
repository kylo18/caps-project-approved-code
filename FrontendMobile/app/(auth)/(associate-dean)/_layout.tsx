import { Tabs } from 'expo-router';
import { View } from 'react-native';
import RoleTabBar from '../../../src/features/core/components/RoleTabBar';
import AdminFloatingTools from '../../../src/features/admin/shared/components/AdminFloatingTools';
import { FloatingToolsProvider, useFloatingToolsState } from '../../../src/contexts/FloatingToolsContext';

function AssociateDeanFloatingTools() {
  const { actions, visible } = useFloatingToolsState();
  return <AdminFloatingTools actions={actions} visible={visible} />;
}

export default function AssociateDeanLayout() {
  return (
    <FloatingToolsProvider>
      <View style={{ flex: 1, position: 'relative' }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => (
            <RoleTabBar {...props} visibleRoutes={['dashboard', 'subjects', 'classes', 'enhancement', 'profile']} />
          )}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
          <Tabs.Screen name="subjects" options={{ title: 'Subjects' }} />
          <Tabs.Screen name="classes" options={{ title: 'Classes' }} />
          <Tabs.Screen name="enhancement" options={{ title: 'Enhancement' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          <Tabs.Screen name="users" options={{ href: null }} />
          <Tabs.Screen name="class-detail" options={{ href: null }} />
          <Tabs.Screen name="analytics" options={{ href: null }} />
          <Tabs.Screen name="reports" options={{ href: null }} />
          <Tabs.Screen name="insights" options={{ href: null }} />
          <Tabs.Screen name="create-announcement" options={{ href: null }} />
          <Tabs.Screen name="archived-classes" options={{ href: null }} />
        </Tabs>
        <AssociateDeanFloatingTools />
      </View>
    </FloatingToolsProvider>
  );
}
