// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Associate Dean dashboard — displays college-wide statistics and
//          provides strategic oversight of all programs, faculty, and students.
//
// Features:
// - Greeting with user name
// - Stats grid (students, faculty, programs, subjects)
// - College performance with progress bars
// - Program comparison chart
// - Quick action cards
// - Subject oversight list
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

export default function AssoDeanDashboard() {
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
    totalPrograms: 0,
    totalSubjects: 0,
    collegeAvgScore: 0,
    collegePassRate: 0,
    monthlyGrowth: 0,
  });

  const firstName = user?.firstName || 'Associate Dean';
  const lastName = user?.lastName || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, usersRes] = await Promise.all([
        apiRequest('/api/subjects'),
        apiRequest('/api/users?limit=10000&status=registered'),
      ]);

      const subjectList = subjectsRes?.data || subjectsRes || [];
      const users = usersRes?.users || usersRes?.data || [];

      setSubjects(Array.isArray(subjectList) ? subjectList : []);

      const facultyCount = Array.isArray(users) ? users.filter((u: any) => [2, 3, 4, 5].includes(u.roleID)).length : 0;
      const studentCount = Array.isArray(users) ? users.filter((u: any) => u.roleID === 1).length : 0;

      setStats({
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        totalPrograms: 4, // Placeholder
        totalSubjects: subjectList.length,
        collegeAvgScore: 74,
        collegePassRate: 80,
        monthlyGrowth: 12,
      });
    } catch (error) {
      console.error('Error fetching associate dean data:', error);
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

  const mainStats = [
    { icon: 'people' as const, value: stats.totalStudents, label: 'Students', color: '#3B82F6' },
    { icon: 'person' as const, value: stats.totalFaculty, label: 'Faculty', color: '#8B5CF6' },
    { icon: 'school' as const, value: stats.totalPrograms, label: 'Programs', color: colors.orange },
    { icon: 'book' as const, value: stats.totalSubjects, label: 'Subjects', color: '#10B981' },
  ];

  const cardStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadow,
  };

  const programScores = [
    { name: 'BSIT', score: 78 },
    { name: 'BSCS', score: 72 },
    { name: 'BSIS', score: 81 },
    { name: 'BSCpE', score: 75 },
  ];

  useScreenFloatingTools([
    {
      key: 'insights',
      icon: 'grid-outline',
      label: 'Insights',
      onPress: () => router.push('/(auth)/(associate-dean)/insights'),
    },
    {
      key: 'enhancement',
      icon: 'trending-up-outline',
      label: 'Enhancement',
      onPress: () => router.push('/(auth)/(associate-dean)/enhancement'),
    },
    {
      key: 'analytics',
      icon: 'analytics-outline',
      label: 'Analytics',
      onPress: () => router.push('/(auth)/(associate-dean)/analytics'),
    },
    {
      key: 'reports',
      icon: 'document-text-outline',
      label: 'Reports',
      onPress: () => router.push('/(auth)/(associate-dean)/reports'),
    },
    {
      key: 'export',
      icon: 'print-outline',
      label: 'Export',
      onPress: () => router.push('/(auth)/(associate-dean)/subjects'),
    },
    {
      key: 'announcement',
      icon: 'megaphone-outline',
      label: 'Announcement',
      onPress: () => router.push('/(auth)/(associate-dean)/create-announcement'),
    },
  ]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.page }}>
        <MobileHeader title="Dashboard" />
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
      <MobileHeader title="Dashboard" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112, paddingTop: 16, gap: 16 }}
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
          {mainStats.map((stat, idx) => (
            <View
              key={idx}
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
            </View>
          ))}
        </View>

        {/* College Performance Card */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          College Performance
        </Text>
        <View className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
          <View className="flex-row justify-between mb-5">
            <View className="items-center">
              <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
                {stats.collegeAvgScore}%
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                College Avg
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-extrabold text-green-500">
                {stats.collegePassRate}%
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                Pass Rate
              </Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-baseline gap-1">
                <Ionicons name="arrow-up" size={16} color="#10B981" />
                <Text className="text-2xl font-extrabold text-green-500">
                  {stats.monthlyGrowth}%
                </Text>
              </View>
              <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                Growth
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
                  {stats.collegeAvgScore}%
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stats.collegeAvgScore}%`, backgroundColor: colors.orange }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: colors.textSoft }}>
                  Pass Rate
                </Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {stats.collegePassRate}%
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stats.collegePassRate}%`, backgroundColor: '#10B981' }}
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
            className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(associate-dean)/reports')}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: `${colors.orange}18` }}
            >
              <Ionicons name="eye" size={24} color={colors.orange} />
            </View>
            <Text className="font-semibold" style={{ color: colors.text }}>
              Subject Oversight
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Review all subjects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(associate-dean)/classes')}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#3B82F615' }}
            >
              <Ionicons name="layers" size={24} color="#3B82F6" />
            </View>
            <Text className="font-semibold" style={{ color: colors.text }}>
              Classes
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Match the web class flow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(associate-dean)/users')}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#8B5CF615' }}
            >
              <Ionicons name="people" size={24} color="#8B5CF6" />
            </View>
            <Text className="font-semibold" style={{ color: colors.text }}>
              User Management
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Still available from Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => router.push('/(auth)/(associate-dean)/subjects')}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#10B98115' }}
            >
              <Ionicons name="bar-chart" size={24} color="#10B981" />
            </View>
            <Text className="font-semibold" style={{ color: colors.text }}>
              Analytics
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              College insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* Program Comparison */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Program Comparison
        </Text>
        <View className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
          {programScores.map((program, idx) => (
            <View
              key={program.name}
              className={`flex-row items-center py-3 ${idx !== programScores.length - 1 ? 'border-b' : ''}`}
              style={{ borderBottomColor: idx !== programScores.length - 1 ? colors.border : 'transparent' }}
            >
              <Text className="w-16 font-semibold" style={{ color: colors.text }}>
                {program.name}
              </Text>
              <View className="flex-1 mx-3">
                <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${program.score}%`, backgroundColor: colors.orange }}
                  />
                </View>
              </View>
              <Text className="w-12 text-right font-semibold" style={{ color: colors.text }}>
                {program.score}%
              </Text>
            </View>
          ))}
        </View>

        {/* Subject Oversight */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Subject Oversight
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
                onPress={() => router.push('/(auth)/(associate-dean)/subjects')}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${colors.orange}18` }}>
                  <Ionicons name="book" size={20} color={colors.orange} />
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
                <Ionicons name="chevron-forward" size={20} color={colors.mutedIcon} />
              </TouchableOpacity>
            ))}

            {subjects.length > 5 && (
              <TouchableOpacity
                className={`flex-row items-center justify-center p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                style={cardStyle}
                onPress={() => router.push('/(auth)/(associate-dean)/subjects')}
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
