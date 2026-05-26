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
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import MobileHeader from '../../../src/features/core/components/MobileHeader';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';

export default function FacultyDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalQuizzes: 0, avgScore: 0 });

  const firstName = user?.firstName || 'Faculty';
  const lastName = user?.lastName || '';

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTypeID, setQuizTypeID] = useState<number>(2); // 1 = subject-based, 2 = custom
  const [quizSubjectID, setQuizSubjectID] = useState<number | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) {
      showToast('Please enter a quiz title', 'error');
      return;
    }
    if (quizTypeID === 1 && !quizSubjectID) {
      showToast('Please select a subject for subject-based quiz', 'error');
      return;
    }

    setIsCreatingQuiz(true);
    try {
      const res = await apiRequest('/api/personal-quizzes', {
        method: 'POST',
        body: {
          title: quizTitle.trim(),
          quiz_type_id: quizTypeID,
          subjectID: quizSubjectID || null,
          coverage_id: quizTypeID === 1 ? 1 : undefined,
        },
      });
      const quizID = res?.quiz?.personalQuizID || res?.personalQuizID || res?.data?.personalQuizID;
      setShowQuizModal(false);
      setQuizTitle('');
      setQuizTypeID(2);
      setQuizSubjectID(null);
      if (quizID) {
        router.push({ pathname: '/(auth)/practice-exam/add-question', params: { personalQuizID: String(quizID), subjectID: quizSubjectID ? String(quizSubjectID) : undefined } });
      } else {
        showToast('Quiz created but could not navigate to add questions', 'success');
      }
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to create quiz', 'error');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subjects assigned to this faculty member
      const subjectsRes = await apiRequest('/api/faculty/my-subjects');
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
    { icon: 'layers' as const, label: 'My Classes', route: '/(auth)/(faculty)/classes', color: colors.orange },
    { icon: 'people' as const, label: 'Students', route: '/(auth)/(faculty)/users', color: '#3B82F6' },
    { icon: 'create' as const, label: 'Create Quiz', color: '#10B981', onPress: () => setShowQuizModal(true) },
    { icon: 'stats-chart' as const, label: 'Reports', route: '/(auth)/(faculty)/reports', color: '#8B5CF6' },
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
      onPress: () => router.push('/(auth)/(faculty)/insights'),
    },
    {
      key: 'reports',
      icon: 'document-text-outline',
      label: 'Reports',
      onPress: () => router.push('/(auth)/(faculty)/reports'),
    },
    {
      key: 'classes',
      icon: 'layers-outline',
      label: 'Classes',
      onPress: () => router.push('/(auth)/(faculty)/classes'),
    },
    {
      key: 'quiz',
      icon: 'create-outline',
      label: 'Create Quiz',
      onPress: () => setShowQuizModal(true),
    },
  ]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.page, paddingBottom: insets.bottom + 12 }}>
        <MobileHeader title="Faculty Dashboard" />
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
    <View className="flex-1" style={{ backgroundColor: colors.page, paddingBottom: insets.bottom + 12 }}>
      <MobileHeader title="Faculty Dashboard" />

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

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/users?filter=student')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: `${colors.orange}18` }}>
              <Ionicons name="people" size={24} color={colors.orange} />
            </View>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
              {stats.totalStudents}
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/subjects')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: '#3B82F618' }}>
              <Ionicons name="book" size={24} color="#3B82F6" />
            </View>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
              {subjects.length}
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Subjects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/(faculty)/subjects')}
            className={`flex-1 rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
            style={cardStyle}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: '#10B98118' }}>
              <Ionicons name="clipboard" size={24} color="#10B981" />
            </View>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
              {stats.totalQuizzes}
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Quizzes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Average Score Card */}
        <View className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-sm" style={{ color: colors.textSoft }}>
                Class Average
              </Text>
              <Text className="text-3xl font-extrabold mt-1" style={{ color: colors.text }}>
                {stats.avgScore}%
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: '#FE690220' }}>
              <Ionicons name="trending-up" size={28} color={colors.orange} />
            </View>
          </View>
          <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${stats.avgScore}%`, backgroundColor: colors.orange }}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {quickActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              className={`w-[48%] rounded-2xl p-4 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              style={cardStyle}
              onPress={() => action.onPress ? action.onPress() : router.push(action.route as string)}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Assigned Subjects */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          My Subjects
        </Text>

        {subjects.length === 0 ? (
          <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={cardStyle}>
            <Ionicons name="book-outline" size={48} color={colors.mutedIcon} />
            <Text className="mt-3 font-semibold" style={{ color: colors.textSoft }}>
              No subjects assigned yet
            </Text>
          </View>
        ) : (
          <>
            {subjects.slice(0, 4).map((subject, idx) => (
              <TouchableOpacity
                key={subject.subjectID || idx}
                className={`flex-row items-center rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                style={cardStyle}
                onPress={() => router.push('/(auth)/(faculty)/subjects')}
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

            {subjects.length > 4 && (
              <TouchableOpacity
                className={`flex-row items-center justify-center p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                style={cardStyle}
                onPress={() => router.push('/(auth)/(faculty)/subjects')}
              >
                <Text className="font-semibold" style={{ color: colors.orange }}>View All Subjects</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.orange} className="ml-2" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Quiz Modal */}
      <Modal visible={showQuizModal} transparent animationType="slide" onRequestClose={() => setShowQuizModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View className={`rounded-t-3xl px-5 pt-5 pb-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <View className="flex-row items-center justify-between mb-5">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Quiz</Text>
                <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quiz Title</Text>
              <TextInput
                value={quizTitle}
                onChangeText={setQuizTitle}
                placeholder="Enter quiz title"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
              />

              <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quiz Type</Text>
              <View className="flex-row gap-3 mb-4">
                {[ { id: 2, label: 'Custom' }, { id: 1, label: 'Subject-based' } ].map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => { setQuizTypeID(type.id); setQuizSubjectID(null); }}
                    className={`flex-1 rounded-xl px-4 py-3 border text-center ${quizTypeID === type.id ? 'border-primary bg-orange-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                  >
                    <Text className={`font-semibold ${quizTypeID === type.id ? 'text-primary' : isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {quizTypeID === 1 && (
                <>
                  <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Subject</Text>
                  <ScrollView style={{ maxHeight: 160 }} className="mb-4">
                    <View style={{ gap: 8 }}>
                      {subjects.map((subject) => {
                        const sid = subject.subjectID || subject.id;
                        return (
                          <TouchableOpacity
                            key={sid}
                            onPress={() => setQuizSubjectID(Number(sid))}
                            className={`rounded-xl px-4 py-3 border ${quizSubjectID === sid ? 'border-primary bg-orange-50' : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                          >
                            <Text className={`font-semibold ${quizSubjectID === sid ? 'text-primary' : isDark ? 'text-white' : 'text-gray-900'}`}>
                              {subject.subjectName || subject.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </>
              )}

              <TouchableOpacity
                onPress={handleCreateQuiz}
                disabled={isCreatingQuiz}
                className="bg-primary rounded-2xl py-4 items-center mt-2"
                style={{ opacity: isCreatingQuiz ? 0.7 : 1 }}
              >
                {isCreatingQuiz ? (
                  <CapsActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Create & Add Questions</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
