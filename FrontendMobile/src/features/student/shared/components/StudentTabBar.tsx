// ─────────────────────────────────────────────────────────────────────────────
// StudentTabBar — custom tab bar for student navigation.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { studentColors, studentShadow } from '../ui/studentTokens';

function getTabIcon(name: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  if (name === 'dashboard') return focused ? 'home' : 'home-outline';
  if (name === 'classes') return focused ? 'school' : 'school-outline';
  if (name === 'leaderboard') return focused ? 'trophy' : 'trophy-outline';
  return focused ? 'analytics' : 'analytics-outline';
}

export function StudentTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;
  const visibleTabNames = new Set(['dashboard', 'classes', 'leaderboard', 'insights']);
  if (!visibleTabNames.has(activeRouteName)) {
    return null;
  }

  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route) => visibleTabNames.has(route.name));
  }, [state.routes]);

  return (
    <View className="absolute left-0 right-0 bottom-0 bg-transparent">
      <View className="w-full flex-row items-center justify-around bg-white rounded-t-[20px] pt-2.5 pb-2" style={studentShadow}>
        {visibleRoutes.map((route) => {
          const focused = activeRouteName === route.name;
          const options = descriptors[route.key]?.options ?? {};
          const iconName = getTabIcon(route.name, focused);
          const label = String(options.title ?? options.headerTitle ?? route.name);

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className="items-center justify-center min-w-[64px] gap-[3px]"
            >
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? studentColors.orange : '#C9C6D8'}
              />
              <Text className="font-sans text-[11px] font-medium leading-[14px]" style={{ color: focused ? studentColors.orange : '#C9C6D8' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}