// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin (Dean) dashboard — displays key platform statistics and provides
//          quick access to management functions.
//
// Features:
// - Welcome banner with admin name
// - Platform stats (questions, users, subjects) with color accents
// - Quick action cards
// - Management list with color bar indicators
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/features/core/components/MobileHeader';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const [stats, setStats] = useState({ questions: 0, users: 0, subjects: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsRes = await apiRequest('/api/dashboard/stats');
      setStats({
        users: statsRes?.data?.users ?? 0,
        subjects: statsRes?.data?.subjects ?? 0,
        questions: statsRes?.data?.questions ?? 0,
      });
    } catch {
      setStats({ users: 0, subjects: 0, questions: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  }, []);

  // Quick action cards
  const quickActions: { icon: IoniconName; label: string; color: string; route: any; description: string }[] = [
    {
      icon: 'analytics',
      label: 'Analytics',
      color: '#8B5CF6',
      route: '/(auth)/(dean)/analytics',
      description: 'View insights'
    },
    {
      icon: 'headset',
      label: 'Support',
      color: '#EF4444',
      route: '/(auth)/(dean)/support',
      description: 'Manage tickets'
    },
    {
      icon: 'layers',
      label: 'Classes',
      color: '#10B981',
      route: '/(auth)/(dean)/classes',
      description: 'Manage class flows'
    },
  ];

  const statCards: { icon: IoniconName; label: string; value: number; color: string; route: any }[] = [
    { icon: 'help-circle', label: 'Questions', value: stats.questions, color: colors.orange, route: '/(auth)/(dean)/subjects' },
    { icon: 'people', label: 'Users', value: stats.users, color: '#10B981', route: '/(auth)/(dean)/users' },
    { icon: 'book', label: 'Subjects', value: stats.subjects, color: '#3B82F6', route: '/(auth)/(dean)/subjects' },
  ];

  const cardStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadow,
  };

  const managementItems = [
    {
      icon: 'people' as IoniconName,
      label: 'User Management',
      description: 'Manage users, roles, and permissions',
      color: '#10B981',
      route: '/(auth)/(dean)/users',
    },
    {
      icon: 'book' as IoniconName,
      label: 'Subject Management',
      description: 'Questions, topics, and content',
      color: '#3B82F6',
      route: '/(auth)/(dean)/subjects',
    },
    {
      icon: 'help-circle' as IoniconName,
      label: 'Support Tickets',
      description: 'View and respond to tickets',
      color: '#EF4444',
      route: '/(auth)/(dean)/support',
    },
  ];

  useScreenFloatingTools([
    {
      key: 'insights',
      icon: 'grid-outline',
      label: 'Insights',
      onPress: () => router.push('/(auth)/(dean)/insights'),
    },
    {
      key: 'enhancement',
      icon: 'trending-up-outline',
      label: 'Enhancement',
      onPress: () => router.push('/(auth)/(dean)/enhancement'),
    },
    {
      key: 'analytics',
      icon: 'analytics-outline',
      label: 'Analytics',
      onPress: () => router.push('/(auth)/(dean)/analytics'),
    },
    {
      key: 'reports',
      icon: 'document-text-outline',
      label: 'Reports',
      onPress: () => router.push('/(auth)/(dean)/reports'),
    },
    {
      key: 'support',
      icon: 'headset-outline',
      label: 'Support',
      onPress: () => router.push('/(auth)/(dean)/support'),
    },
    {
      key: 'export',
      icon: 'print-outline',
      label: 'Export',
      onPress: () => router.push('/(auth)/(dean)/subjects'),
    },
  ]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <MobileHeader title="Dashboard" />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color={colors.orange} />
          <Text className="mt-3" style={{ color: colors.textSoft }}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 112 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange}
            />
          }
        >
          {/* Welcome Banner */}
          <View className="px-4 pt-4">
            <View
              className="rounded-2xl p-5 flex-row items-center"
              style={{
                backgroundColor: isDark ? colors.headerWarm : colors.statsCard,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadow,
              }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.orange }}
              >
                <Ionicons name="happy-outline" size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  Welcome back, {user?.firstName || 'Admin'}
                </Text>
                <Text className="text-sm mt-0.5" style={{ color: colors.textSoft }}>
                  Dean · CAPS Platform
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className="px-4 pt-4">
            <View className="flex-row gap-3">
              {statCards.map((card, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(card.route)}
                  className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  activeOpacity={0.8}
                  style={[cardStyle, {
                    borderLeftWidth: 4,
                    borderLeftColor: card.color,
                  }]}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <Ionicons name={card.icon} size={28} color={card.color} />
                  </View>
                  <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
                    {card.value ?? '--'}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-4 pt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(action.route)}
                  className={`w-[48%] rounded-2xl p-5 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  activeOpacity={0.8}
                  style={cardStyle}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Ionicons name={action.icon} size={32} color={action.color} />
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {action.label}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
                    {action.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Management Section */}
          <View className="px-4 pt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="briefcase-outline" size={20} color={colors.textSoft} />
              <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                Management
              </Text>
            </View>

            {managementItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push(item.route)}
                className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                activeOpacity={0.8}
                style={[cardStyle, {
                  borderLeftWidth: 4,
                  borderLeftColor: item.color,
                }]}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {item.label}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSoft }}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedIcon} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Safe Area */}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}
