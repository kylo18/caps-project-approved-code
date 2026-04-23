import { Ionicons } from '@expo/vector-icons'; import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

type RoleTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
  visibleRoutes: string[];
};

type IconPair = {
  focused: keyof typeof Ionicons.glyphMap;
  unfocused: keyof typeof Ionicons.glyphMap;
};

const ICONS: Record<string, IconPair> = {
  dashboard: { focused: 'home', unfocused: 'home-outline' },
  subjects: { focused: 'book', unfocused: 'book-outline' },
  classes: { focused: 'school', unfocused: 'school-outline' },
  users: { focused: 'people', unfocused: 'people-outline' },
  analytics: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  reports: { focused: 'document-text', unfocused: 'document-text-outline' },
  support: { focused: 'help-circle', unfocused: 'help-circle-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
  enhancement: { focused: 'trending-up', unfocused: 'trending-up-outline' },
};

export default function RoleTabBar({
  state,
  descriptors,
  navigation,
  visibleRoutes,
}: RoleTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const activeRouteName = state.routes[state.index]?.name;
  const visibleRouteSet = new Set(visibleRoutes);
  const routes = state.routes.filter((route: any) => visibleRouteSet.has(route.name));

  return (
    <View
      style={{
        backgroundColor: isDark ? '#000' : 'transparent',
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          marginHorizontal: 12,
          borderRadius: 22,
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          paddingVertical: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.25 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {routes.map((route: any) => {
          const focused = activeRouteName === route.name;
          const options = descriptors[route.key]?.options ?? {};
          const label = options.title ?? options.tabBarLabel ?? route.name;
          const iconPair = ICONS[route.name] ?? ICONS.dashboard;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={{
                minWidth: 58,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Ionicons
                name={focused ? iconPair.focused : iconPair.unfocused}
                size={22}
                color={focused ? '#FE6902' : isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: focused ? '700' : '500',
                  color: focused ? '#FE6902' : isDark ? '#9CA3AF' : '#6B7280',
                }}
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
