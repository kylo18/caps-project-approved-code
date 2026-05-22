// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair dashboard — displays program-wide statistics and provides
//          oversight of faculty, subjects, and student performance within the program.
//
// Features:
// - Greeting with user name
// - Stats grid (students, faculty, subjects, quizzes)
// - Performance overview with progress bars
// - Quick action cards
// - Subject overview list
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/features/core/components/MobileHeader';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 3;

export default function ProgramChairDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalSubjects: 0,
    avgScore: 0,
    passRate: 0,
    activeQuizzes: 0,
  });

  const firstName = user?.firstName || 'Program Chair';
  const lastName = user?.lastName || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subjects for this program
      const subjectsRes = await apiRequest('/api/subjects');
      const subjectList = subjectsRes?.subjects || subjectsRes?.data || subjectsRes || [];
      setSubjects(Array.isArray(subjectList) ? subjectList : []);

      // Fetch users count (faculty and students)
      const usersRes = await apiRequest('/api/users?limit=10000&status=registered');
      const users = usersRes?.users || usersRes?.data || [];

      const facultyCount = Array.isArray(users) ? users.filter((u: any) => [2, 3, 4, 5].includes(u.roleID)).length : 0;
      const studentCount = Array.isArray(users) ? users.filter((u: any) => u.roleID === 1).length : 0;

      // Fetch real analytics data
      let avgScore = 0;
      let passRate = 0;
      let activeQuizzes = 0;
      try {
        const [summaryRes, passFailRes] = await Promise.all([
          apiRequest('/api/admin/analytics/summary'),
          apiRequest('/api/admin/analytics/pass-fail-rate'),
        ]);
        const summary = summaryRes?.data || summaryRes || {};
        const passFail = passFailRes?.data || passFailRes || {};
        avgScore = Math.round(Number(summary.average_score ?? 0));
        passRate = Math.round(Number(passFail.pass_rate ?? 0));
        activeQuizzes = Number(summary.total_exams ?? 0);
      } catch (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }

      setStats({
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        totalSubjects: subjectList.length,
        avgScore,
        passRate,
        activeQuizzes,
      });
    } catch (error) {
      console.error('Error fetching program chair data:', error);
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

  const statCards = [
    { icon: 'people' as const, value: stats.totalStudents, label: 'Students', color: '#3B82F6', route: '/(auth)/(program-chair)/users?filter=student' },
    { icon: 'person' as const, value: stats.totalFaculty, label: 'Faculty', color: '#8B5CF6', route: '/(auth)/(program-chair)/users?filter=admin' },
    { icon: 'book' as const, value: stats.totalSubjects, label: 'Subjects', color: colors.orange, route: '/(auth)/(program-chair)/subjects' },
    { icon: 'clipboard' as const, value: stats.activeQuizzes, label: 'Quizzes', color: '#10B981', route: '/(auth)/(program-chair)/subjects' },
  ];

  const cardStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadow,
  };

  useScreenFloatingTools([
    {
      key: 'insights',
      icon: 'grid-outline',
      label: 'Insights',
      onPress: () => router.push('/(auth)/(program-chair)/insights'),
    },
    {
      key: 'reports',
      icon: 'bar-chart-outline',
      label: 'Reports',
      onPress: () => router.push('/(auth)/(program-chair)/reports'),
    },
    {
      key: 'export',
      icon: 'print-outline',
      label: 'Export',
      onPress: () => router.push('/(auth)/(program-chair)/subjects'),
    },
    {
      key: 'classes',
      icon: 'layers-outline',
      label: 'Classes',
      onPress: () => router.push('/(auth)/(program-chair)/classes'),
    },
  ]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.page }}>
        <MobileHeader title="Program Chair" />
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color={colors.orange} />
          <Text className="mt-3" style={{ color: colors.textSoft }}>
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <MobileHeader title="Program Chair" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 112, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.orange} />
        }
      >
        {/* Greeting Section */}
        <View className="mb-2">
          <Text className="text-sm" style={{ color: colors.textSoft }}>
            {getGreeting()},
          </Text>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {firstName} {lastName}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3">
          {statCards.map((stat, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => stat.route && router.push(stat.route as string)}
              className={`rounded-2xl p-3 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              style={[{ width: CARD_WIDTH }, cardStyle]}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text className="text-xl font-extrabold" style={{ color: colors.text }}>
                {stat.value}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Performance Overview */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Program Performance
        </Text>
        <View className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
          <View className="flex-row justify-around mb-5">
            <View className="items-center">
              <Text className="text-3xl font-extrabold" style={{ color: colors.text }}>
                {stats.avgScore}%
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                Avg Score
              </Text>
            </View>
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <View className="items-center">
              <Text className="text-3xl font-extrabold text-green-500">
                {stats.passRate}%
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                Pass Rate
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: colors.textSoft }}>
                  Average Score
                </Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {stats.avgScore}%
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stats.avgScore}%`, backgroundColor: colors.orange }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: colors.textSoft }}>
                  Pass Rate
                </Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {stats.passRate}%
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stats.passRate}%`, backgroundColor: '#10B981' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(program-chair)/subjects')}
            activeOpacity={0.7}
          >
            <Ionicons name="library" size={28} color={colors.orange} />
            <Text className="font-semibold mt-3" style={{ color: colors.text }}>
              Manage Subjects
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Review curriculum
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(program-chair)/users')}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={28} color="#3B82F6" />
            <Text className="font-semibold mt-3" style={{ color: colors.text }}>
              User Management
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Manage students & faculty
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(program-chair)/classes')}
            activeOpacity={0.7}
          >
            <Ionicons name="layers" size={28} color="#10B981" />
            <Text className="font-semibold mt-3" style={{ color: colors.text }}>
              Manage Classes
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Match the web class flow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(program-chair)/reports')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={28} color="#8B5CF6" />
            <Text className="font-semibold mt-3" style={{ color: colors.text }}>
              Generate Reports
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Export analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Overview */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Subject Overview
        </Text>

        {subjects.length === 0 ? (
          <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
            <Ionicons name="book-outline" size={48} color={colors.mutedIcon} />
            <Text className="mt-3 font-semibold" style={{ color: colors.textSoft }}>
              No subjects found
            </Text>
          </View>
        ) : (
          <>
            {subjects.slice(0, 5).map((subject, idx) => (
              <TouchableOpacity
                key={subject.subjectID || idx}
                className={`flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                style={cardStyle}
                onPress={() => router.push('/(auth)/(program-chair)/subjects')}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#3B82F618' }}>
                  <Ionicons name="book" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {subject.subjectName || subject.name}
                  </Text>
                  {subject.subjectCode && (
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSoft }}>
                      {subject.subjectCode}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center gap-3 mr-2">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="people" size={14} color="#3B82F6" />
                    <Text className="text-xs" style={{ color: colors.textSoft }}>
                      24
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedIcon} />
              </TouchableOpacity>
            ))}

            {subjects.length > 5 && (
              <TouchableOpacity
                className={`flex-row items-center justify-center p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                style={cardStyle}
                onPress={() => router.push('/(auth)/(program-chair)/subjects')}
              >
                <Text className="font-semibold" style={{ color: colors.orange }}>View All Subjects</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.orange} className="ml-2" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
