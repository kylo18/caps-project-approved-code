// ─────────────────────────────────────────────────────────────────────────────
// StudentTabBar — custom tab bar for student navigation.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type StudentTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

function getTabIcon(name: string, focused: boolean) {
  if (name === 'dashboard') return focused ? 'home' : 'home-outline';
  if (name === 'classes') return focused ? 'school' : 'school-outline';
  if (name === 'leaderboard') return focused ? 'trophy' : 'trophy-outline';
  return focused ? 'analytics' : 'analytics-outline';
}

const studentShadow = Platform.select({
  android: { elevation: 5 },
  default: {
    shadowColor: '#062B2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
});

export function StudentTabBar({ state, descriptors, navigation }: StudentTabBarProps) {
  const routes = state.routes;
  const visibleTabNames = new Set(['dashboard', 'classes', 'leaderboard', 'insights']);
  const activeRouteName = state.routes[state.index]?.name;
  const visibleRoutes = routes.filter((route: any) => visibleTabNames.has(route.name));

  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any) => {
          const focused = activeRouteName === route.name;
          const options = descriptors[route.key]?.options ?? {};
          const iconName = getTabIcon(route.name, focused);
          const label = options.title ?? options.headerTitle ?? route.name;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabBarItem}
            >
              <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={focused ? '#FF6E00' : '#C9C6D8'} />
              <Text style={[styles.tabBarLabel, { color: focused ? '#FF6E00' : '#C9C6D8' }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 8,
    ...studentShadow,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    gap: 3,
  },
  tabBarLabel: {
    fontFamily: 'Rubik',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
});