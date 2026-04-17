// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Faculty dashboard — displays faculty-specific statistics and provides
//          quick access to assigned subjects, student progress, and quiz creation.
//
// Features:
// - Greeting with user name
// - Stats cards (students, subjects, quizzes)
// - Class average with progress bar
// - Quick action cards
// - Assigned subjects list
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/components/MobileHeader';

export default function FacultyDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalQuizzes: 0, avgScore: 0 });

  const firstName = user?.firstName || 'Faculty';
  const lastName = user?.lastName || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subjects assigned to this faculty member
      const subjectsRes = await apiRequest('/api/subjects');
      const subjectList = subjectsRes?.subjects || subjectsRes?.data || subjectsRes || [];
      setSubjects(Array.isArray(subjectList) ? subjectList : []);

      // Fetch real analytics data
      let avgScore = 0;
      let totalStudents = 0;
      let totalQuizzes = 0;
      try {
        const [summaryRes, myStudentsRes] = await Promise.allSettled([
          apiRequest('/api/admin/analytics/summary'),
          apiRequest('/api/my-students'),
        ]);
        const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value?.data || summaryRes.value || {}) : {};
        avgScore = Math.round(Number(summary.average_score ?? 0));
        totalQuizzes = Number(summary.total_exams ?? 0);

        const myStudents = myStudentsRes.status === 'fulfilled' ? (myStudentsRes.value?.data || myStudentsRes.value || []) : [];
        totalStudents = Array.isArray(myStudents) ? myStudents.length : Number(summary.active_students ?? 0);
      } catch (analyticsError) {
        console.error('Error fetching faculty analytics:', analyticsError);
        totalQuizzes = subjectList.length * 2;
      }

      setStats({
        totalStudents,
        totalQuizzes,
        avgScore,
      });
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: 'book' as const, label: 'My Subjects', route: '/(auth)/(faculty)/subjects', color: '#FE6902' },
    { icon: 'people' as const, label: 'Students', route: '/(auth)/(faculty)/users', color: '#3B82F6' },
    { icon: 'create' as const, label: 'Create Quiz', route: '/(auth)/practice-exam/add-question', color: '#10B981' },
    { icon: 'stats-chart' as const, label: 'Reports', route: '/(auth)/(faculty)/subjects', color: '#8B5CF6' },
  ];

  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <MobileHeader title="Faculty Dashboard" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FE6902" />
          <Text className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <MobileHeader title="Faculty Dashboard" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 112, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FE6902" />
        }
      >
        {/* Greeting Section */}
        <View className="mb-2">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {getGreeting()},
          </Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {firstName} {lastName}
          </Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/users?filter=student')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-orange-100 mb-2">
              <Ionicons name="people" size={24} color="#FE6902" />
            </View>
            <Text className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalStudents}
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/subjects')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-blue-100 mb-2">
              <Ionicons name="book" size={24} color="#3B82F6" />
            </View>
            <Text className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {subjects.length}
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Subjects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/subjects')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-green-100 mb-2">
              <Ionicons name="clipboard" size={24} color="#10B981" />
            </View>
            <Text className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalQuizzes}
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Quizzes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Average Score Card */}
        <View className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Class Average
              </Text>
              <Text className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.avgScore}%
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: '#FE690220' }}>
              <Ionicons name="trending-up" size={28} color="#FE6902" />
            </View>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${stats.avgScore}%`, backgroundColor: '#FE6902' }}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Text className={`text-base font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {quickActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Assigned Subjects */}
        <Text className={`text-base font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          My Subjects
        </Text>

        {subjects.length === 0 ? (
          <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <Ionicons name="book-outline" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text className={`mt-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No subjects assigned yet
            </Text>
          </View>
        ) : (
          <>
            {subjects.slice(0, 4).map((subject, idx) => (
              <TouchableOpacity
                key={subject.subjectID || idx}
                className={`flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                onPress={() => router.push('/(auth)/(faculty)/subjects')}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center bg-orange-100">
                  <Ionicons name="book" size={20} color="#FE6902" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {subject.subjectName || subject.name}
                  </Text>
                  {subject.subjectCode && (
                    <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {subject.subjectCode}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </TouchableOpacity>
            ))}

            {subjects.length > 4 && (
              <TouchableOpacity
                className={`flex-row items-center justify-center p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                onPress={() => router.push('/(auth)/(faculty)/subjects')}
              >
                <Text className="text-primary font-semibold">View All Subjects</Text>
                <Ionicons name="arrow-forward" size={16} color="#FE6902" className="ml-2" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
