// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair dashboard — displays program-wide statistics and provides
//          oversight of faculty, subjects, and student performance within the program.
//
// Features:
// - Greeting with user name
// - Stats grid (students, faculty, subjects, quizzes)
// - Performance overview with progress bars
// - Quick action cards (including Create Quiz)
// - Subject overview list
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProgramChairDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalSubjects: 0,
    totalQuestions: 0,
    avgScore: 0,
    passRate: 0,
  });

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [programScores, setProgramScores] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTypeID, setQuizTypeID] = useState<number>(2); // 1 = subject-based, 2 = custom
  const [quizSubjectID, setQuizSubjectID] = useState<number | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  const firstName = user?.firstName || 'Program Chair';
  const lastName = user?.lastName || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subjects for quiz modal
      const subjectsRes = await apiRequest('/api/subjects');
      const subjectList = subjectsRes?.subjects || subjectsRes?.data || subjectsRes || [];
      setSubjects(Array.isArray(subjectList) ? subjectList : []);

      // Fetch all stats from unified dashboard endpoint
      const [statsRes, comparisonRes] = await Promise.allSettled([
        apiRequest('/api/dashboard/stats'),
        apiRequest('/api/admin/analytics/program-comparison'),
      ]);
      const statsData = statsRes.status === 'fulfilled' ? (statsRes.value?.data || statsRes.value || {}) : {};

      setStats({
        totalStudents: Number(statsData.students ?? 0),
        totalFaculty: Number(statsData.faculty ?? 0),
        totalSubjects: Number(statsData.subjects ?? subjectList.length),
        totalQuestions: Number(statsData.questions ?? 0),
        avgScore: Math.round(Number(statsData.average_score ?? 0)),
        passRate: Math.round(Number(statsData.pass_rate ?? 0) * 100),
      });

      if (comparisonRes.status === 'fulfilled') {
        const comp = comparisonRes.value?.data || comparisonRes.value || [];
        setProgramScores(Array.isArray(comp) ? comp : []);
      }
    } catch (error) {
      console.error('Error fetching program chair data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
    { icon: 'help-circle' as const, value: stats.totalQuestions, label: 'Questions', color: '#10B981', route: '/(auth)/(program-chair)/subjects' },
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
    {
      key: 'quiz',
      icon: 'create-outline',
      label: 'Create Quiz',
      onPress: () => setShowQuizModal(true),
    },
  ]);

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
              className={`rounded-2xl p-3 items-center ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
        <View className={`rounded-2xl p-5 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`} style={cardStyle}>
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

        {/* Program Comparison */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Program Comparison
        </Text>
        <View className={`rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`} style={cardStyle}>
          {programScores.length === 0 ? (
            <View className="items-center py-4">
              <Ionicons name="bar-chart-outline" size={32} color={colors.mutedIcon} />
              <Text className="mt-2 text-sm" style={{ color: colors.textSoft }}>
                No exam data available yet
              </Text>
            </View>
          ) : (
            programScores.map((program, idx) => {
              const score = Math.round(Number(program.average_score ?? 0));
              return (
                <View
                  key={program.programID ?? program.programName}
                  className={`flex-row items-center py-3 ${idx !== programScores.length - 1 ? 'border-b' : ''}`}
                  style={{ borderBottomColor: idx !== programScores.length - 1 ? colors.border : 'transparent' }}
                >
                  <Text className="w-20 font-semibold text-sm" style={{ color: colors.text }}>
                    {program.programName}
                  </Text>
                  <View className="flex-1 mx-3">
                    <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.cardSoft }}>
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${score}%`, backgroundColor: colors.orange }}
                      />
                    </View>
                  </View>
                  <Text className="w-12 text-right font-semibold text-xs" style={{ color: colors.text }}>
                    {score}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
          <TouchableOpacity
            className={`w-[48%] rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
            style={cardStyle}
            onPress={() => setShowQuizModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create" size={28} color="#10B981" />
            <Text className="font-semibold mt-3" style={{ color: colors.text }}>
              Create Quiz
            </Text>
            <Text className="text-xs mt-1" style={{ color: colors.textSoft }}>
              Design new quiz
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Overview */}
        <Text className="text-base font-bold mt-2" style={{ color: colors.text }}>
          Subject Overview
        </Text>

        {subjects.length === 0 ? (
          <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`} style={cardStyle}>
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
                className={`flex-row items-center rounded-xl p-4 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
                className={`flex-row items-center justify-center p-4 rounded-xl ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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

      {/* Create Quiz Modal */}
      <Modal visible={showQuizModal} transparent animationType="slide" onRequestClose={() => setShowQuizModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View className={`rounded-t-3xl px-5 pt-5 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`} style={{ paddingBottom: Math.max(insets.bottom + 16, 34) }}>
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
                className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'bg-[#242424] text-white border-[#2A2A2A]' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
              />

              <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quiz Type</Text>
              <View className="flex-row gap-3 mb-4">
                {[ { id: 2, label: 'Custom' }, { id: 1, label: 'Subject-based' } ].map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => { setQuizTypeID(type.id); setQuizSubjectID(null); }}
                    className={`flex-1 rounded-xl px-4 py-3 border text-center ${quizTypeID === type.id ? 'border-[#FE6902]' : isDark ? 'border-[#2A2A2A] bg-[#242424]' : 'border-gray-200 bg-white'}`}
                    style={{ backgroundColor: isDark && quizTypeID === type.id ? 'rgba(254,105,2,0.15)' : undefined }}
                  >
                    <Text className={`font-semibold ${quizTypeID === type.id ? 'text-[#FE6902]' : isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</Text>
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
                            className={`rounded-xl px-4 py-3 border ${quizSubjectID === sid ? 'border-[#FE6902]' : isDark ? 'border-[#2A2A2A] bg-[#242424]' : 'border-gray-200 bg-white'}`}
                            style={{ backgroundColor: isDark && quizSubjectID === sid ? 'rgba(254,105,2,0.15)' : isDark && quizSubjectID !== sid ? '#242424' : undefined }}
                          >
                            <Text className={`font-semibold ${quizSubjectID === sid ? 'text-[#FE6902]' : isDark ? 'text-white' : 'text-gray-900'}`}>
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
