import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRoleShadow, getRoleThemeColors } from '../styles/roleTheme';

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

const ROUTE_TAB_MAP: Record<string, string> = {
  // Home (dashboard) related sub-routes
  dashboard: 'dashboard',
  insights: 'dashboard',
  reports: 'dashboard',
  analytics: 'dashboard',
  users: 'dashboard',
  'create-announcement': 'dashboard',
  
  // Subjects related
  subjects: 'subjects',
  
  // Classes related
  classes: 'classes',
  'class-detail': 'classes',
  'archived-classes': 'classes',
  
  // Enhancement related
  enhancement: 'enhancement',
  
  // Profile related
  profile: 'profile',
  support: 'profile',
};

const showTabRoutes = new Set([
  'dashboard', 'subjects', 'classes', 'enhancement', 'profile',
  'users', 'class-detail', 'analytics', 'reports', 'insights',
  'support', 'create-announcement', 'archived-classes'
]);

export default function RoleTabBar({
  state,
  descriptors,
  navigation,
  visibleRoutes,
}: RoleTabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;
  const visibleRouteSet = new Set(visibleRoutes);
  
  if (!visibleRouteSet.has(activeRouteName) && !showTabRoutes.has(activeRouteName)) {
    return null;
  }

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';
  const colors = getRoleThemeColors(isDark);
  const shadow = getRoleShadow(isDark);
  const routes = state.routes.filter((route: any) => visibleRouteSet.has(route.name));

  return (
    <View
      style={{
        backgroundColor: isDark ? colors.page : 'transparent',
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
          backgroundColor: colors.surface,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          paddingVertical: 10,
          ...shadow,
        }}
      >
        {routes.map((route: any) => {
          const activeTabName = ROUTE_TAB_MAP[activeRouteName] || activeRouteName;
          const focused = activeTabName === route.name;
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
                color={focused ? colors.accent : colors.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: focused ? '700' : '500',
                  color: focused ? colors.accent : colors.muted,
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
