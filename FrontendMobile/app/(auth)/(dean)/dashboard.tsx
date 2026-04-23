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
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/components/MobileHeader';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';

type IoniconName = keyof typeof Ionicons.glyphMap;
type DashboardSubject = { subjectID: number; [key: string]: any };

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
      const [uRes, sRes] = await Promise.allSettled([
        apiRequest('/api/users?limit=10000'),
        apiRequest('/api/subjects'),
      ]);

      const userPayload = uRes.status === 'fulfilled' ? uRes.value : null;
      const users = Array.isArray(userPayload?.users) ? userPayload.users :
        Array.isArray(userPayload?.data) ? userPayload.data : [];
      const activeUsers = users.filter((u: any) => u.status === 'registered' && u.isActive).length;

      const subjectPayload = sRes.status === 'fulfilled' ? sRes.value : null;
      const subjects = Array.isArray(subjectPayload?.subjects) ? subjectPayload.subjects :
        Array.isArray(subjectPayload?.data) ? subjectPayload.data :
        Array.isArray(subjectPayload) ? subjectPayload : [];

      const questionResponses = await Promise.allSettled(
        subjects.map((subject: DashboardSubject) => apiRequest(`/api/subjects/${subject.subjectID}/questions`))
      );

      const approvedCount = questionResponses.reduce((count, response) => {
        if (response.status !== 'fulfilled') {
          return count;
        }

        const questions = Array.isArray(response.value?.data) ? response.value.data :
          Array.isArray(response.value?.questions) ? response.value.questions :
            Array.isArray(response.value) ? response.value : [];

        return count + questions.filter((q: any) => {
          const status = String(q?.status_name || q?.status || '').toLowerCase();
          const statusId = Number(q?.status_id);
          return statusId === 2 || status === 'approved';
        }).length;
      }, 0);

      setStats({ questions: approvedCount, users: activeUsers, subjects: subjects.length });
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load statistics', 'error');
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
    { icon: 'help-circle', label: 'Questions', value: stats.questions, color: '#FE6902', route: '/(auth)/(dean)/subjects' },
    { icon: 'people', label: 'Users', value: stats.users, color: '#10B981', route: '/(auth)/(dean)/users' },
    { icon: 'book', label: 'Subjects', value: stats.subjects, color: '#3B82F6', route: '/(auth)/(dean)/subjects' },
  ];

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
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <MobileHeader title="Dashboard" />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color="#FE6902" />
          <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
              tintColor="#FE6902"
            />
          }
        >
          {/* Welcome Banner */}
          <View className="px-4 pt-4">
            <View
              className="rounded-2xl p-5 flex-row items-center"
              style={{
                backgroundColor: isDark ? '#111827' : '#FFF7ED',
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#FED7AA',
              }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: '#FE6902' }}
              >
                <Ionicons name="happy-outline" size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Welcome back, {user?.firstName || 'Admin'}
                </Text>
                <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: card.color,
                    shadowColor: isDark ? '#000' : card.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <Ionicons name={card.icon} size={28} color={card.color} />
                  </View>
                  <Text className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {card.value ?? '--'}
                  </Text>
                  <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-4 pt-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(action.route)}
                  className={`w-[48%] rounded-2xl p-5 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  activeOpacity={0.8}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Ionicons name={action.icon} size={32} color={action.color} />
                  </View>
                  <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {action.label}
                  </Text>
                  <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {action.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Management Section */}
          <View className="px-4 pt-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="briefcase-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-lg font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Management
              </Text>
            </View>

            {managementItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push(item.route)}
                className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                activeOpacity={0.8}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: item.color,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.label}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
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
