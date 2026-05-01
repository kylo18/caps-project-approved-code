// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Student bottom tab bar with 4 tabs: Dashboard, Classes,
//          Leaderboard, Insights. Replaces default Expo Router TabBar.
// ─────────────────────────────────────────────────────────────────────────────

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { studentColors, studentShadow } from '../studentTheme';

function getTabIcon(name: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  if (name === 'dashboard') return focused ? 'home' : 'home-outline';
  if (name === 'classes') return focused ? 'school' : 'school-outline';
  if (name === 'leaderboard') return focused ? 'trophy' : 'trophy-outline';
  return focused ? 'analytics' : 'analytics-outline';
}

export function StudentTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const visibleRoutes = useMemo(() => {
    const visibleTabNames = new Set(['dashboard', 'classes', 'leaderboard', 'insights']);
    return state.routes.filter((route) => visibleTabNames.has(route.name));
  }, [state.routes]);

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route) => {
          const focused = activeRouteName === route.name;
          const options = descriptors[route.key]?.options ?? {};
          const iconName = getTabIcon(route.name, focused);
          const label = String(options.title ?? options.headerTitle ?? route.name);

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabBarItem}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? studentColors.orange : '#C9C6D8'}
              />
              <Text
                style={[
                  styles.tabBarLabel,
                  { color: focused ? studentColors.orange : '#C9C6D8' },
                ]}
              >
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
    backgroundColor: studentColors.white,
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