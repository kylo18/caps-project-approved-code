// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin (Dean) dashboard — displays key platform statistics and provides
//          quick access to management functions.
//
// Features:
// - Platform stats (questions, users, subjects)
// - Quick action cards
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/components/MobileHeader';

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
      const [qRes, uRes, sRes] = await Promise.all([
        apiRequest('/api/questions/count'),
        apiRequest('/api/users?limit=10000'),
        apiRequest('/api/subjects'),
      ]);

      const questions = Array.isArray(qRes?.data) ? qRes.data : [];
      const approvedCount = questions.filter((q) => q.status_id === 2).length;

      const users = Array.isArray(uRes?.users) ? uRes.users :
        Array.isArray(uRes?.data) ? uRes.data : [];
      const activeUsers = users.filter((u) => u.status === 'registered' && u.isActive).length;

      const subjects = Array.isArray(sRes?.data) ? sRes.data :
        Array.isArray(sRes) ? sRes : [];

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
  const quickActions = [
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
  ];

  const statCards = [
    { icon: 'help-circle', label: 'Questions', value: stats.questions, color: '#FE6902', route: '/(auth)/(dean)/subjects' },
    { icon: 'people', label: 'Users', value: stats.users, color: '#10B981', route: '/(auth)/(dean)/users' },
    { icon: 'book', label: 'Subjects', value: stats.subjects, color: '#3B82F6', route: '/(auth)/(dean)/subjects' },
  ];

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <MobileHeader title="Admin Dashboard" />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FE6902" />
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
          {/* Stats Row */}
          <View className="px-4 pt-4">
            <View className="flex-row gap-3">
              {statCards.map((card, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(card.route)}
                  className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  activeOpacity={0.8}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: `${card.color}20` }}
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
            <View className="flex-row gap-3">
              {quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(action.route)}
                  className={`flex-1 rounded-2xl p-5 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                  activeOpacity={0.8}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${action.color}20` }}
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
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Management
            </Text>

            {/* Users Card */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(dean)/users')}
              className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center bg-green-100">
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <View className="flex-1 ml-4">
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  User Management
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Manage users, roles, and permissions
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>

            {/* Subjects Card */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(dean)/subjects')}
              className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center bg-blue-100">
                <Ionicons name="book" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Subject Management
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Questions, topics, and content
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>

            {/* Support Card */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/(dean)/support')}
              className={`flex-row items-center rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center bg-red-100">
                <Ionicons name="help-circle" size={24} color="#EF4444" />
              </View>
              <View className="flex-1 ml-4">
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Support Tickets
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  View and respond to tickets
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Bottom Safe Area */}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}
