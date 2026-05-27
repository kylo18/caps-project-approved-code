// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin (Dean) dashboard — displays key platform statistics and provides
//          quick access to management functions.
//
// Features:
// - Welcome banner with admin name
// - Platform stats (questions, users, subjects) with color accents
// - Quick action cards (including Create Quiz)
// - Management list with color bar indicators
// - Pull-to-refresh
// - Uses MobileHeader with NativeWind styling
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    subjects: 0,
    questions: 0,
    programs: 0,
    collegeAvgScore: 0,
    collegePassRate: 0,
    monthlyGrowth: 0,
    currentMonthAvg: 0,
    previousMonthAvg: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [programScores, setProgramScores] = useState<any[]>([]);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTypeID, setQuizTypeID] = useState<number>(2); // 1 = subject-based, 2 = custom
  const [quizSubjectID, setQuizSubjectID] = useState<number | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, subjectsRes, comparisonRes] = await Promise.allSettled([
        apiRequest('/api/dashboard/stats'),
        apiRequest('/api/subjects'),
        apiRequest('/api/admin/analytics/program-comparison'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value?.data || statsRes.value || {};
        setStats({
          students: Number(data.students ?? 0),
          faculty: Number(data.faculty ?? 0),
          subjects: Number(data.subjects ?? 0),
          questions: Number(data.questions ?? 0),
          programs: Number(data.programs ?? 0),
          collegeAvgScore: Number(data.average_score ?? 0),
          collegePassRate: Number(data.pass_rate ?? 0) * 100,
          monthlyGrowth: Number(data.improvement_percentage ?? 0) * 100,
          currentMonthAvg: Number(data.current_month_avg ?? 0),
          previousMonthAvg: Number(data.previous_month_avg ?? 0),
        });
      }

      if (subjectsRes.status === 'fulfilled') {
        const subjectList = subjectsRes.value?.subjects || subjectsRes.value?.data || subjectsRes.value || [];
        setSubjects(Array.isArray(subjectList) ? subjectList : []);
      }

      if (comparisonRes.status === 'fulfilled') {
        const comp = comparisonRes.value?.data || comparisonRes.value || [];
        setProgramScores(Array.isArray(comp) ? comp : []);
      }
    } catch {
      setStats({ students: 0, faculty: 0, subjects: 0, questions: 0, programs: 0, collegeAvgScore: 0, collegePassRate: 0, monthlyGrowth: 0, currentMonthAvg: 0, previousMonthAvg: 0 });
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
    await fetchStats();
    setIsRefreshing(false);
  }, []);

  // Quick action cards
  const quickActions: { icon: IoniconName; label: string; color: string; route?: any; description: string; onPress?: () => void }[] = [
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
    {
      icon: 'create',
      label: 'Create Quiz',
      color: '#FE6902',
      description: 'Design new quiz',
      onPress: () => setShowQuizModal(true)
    },
  ];

  const statCards: { icon: IoniconName; value: number; label: string; color: string }[] = [
    { icon: 'people', value: stats.students, label: 'Students', color: '#3B82F6' },
    { icon: 'person', value: stats.faculty, label: 'Faculty', color: '#8B5CF6' },
    { icon: 'book', value: stats.subjects, label: 'Subjects', color: '#10B981' },
    { icon: 'help-circle', value: stats.questions, label: 'Questions', color: colors.orange },
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
    {
      key: 'quiz',
      icon: 'create-outline',
      label: 'Create Quiz',
      onPress: () => setShowQuizModal(true),
    },
  ]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page, paddingBottom: insets.bottom + 12 }}>
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

          {/* Stats Grid */}
          <View className="px-4 pt-4">
            <View className="flex-row flex-wrap gap-3">
              {statCards.map((stat, idx) => (
                <View
                  key={idx}
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
                </View>
              ))}
            </View>
          </View>

          {/* College Performance */}
          <View className="px-4 pt-6">
            <View className={`rounded-2xl p-5 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`} style={cardStyle}>
              <View className="flex-row justify-between mb-5">
                <View className="items-center">
                  <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
                    {stats.currentMonthAvg.toFixed(2)}%
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                    Current Month
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>
                    {stats.previousMonthAvg.toFixed(2)}%
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSoft }}>
                    Previous Month
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-baseline gap-1">
                    <Ionicons name="arrow-up" size={16} color="#10B981" />
                    <Text className="text-2xl font-extrabold text-green-500">
                      {stats.monthlyGrowth.toFixed(2)}%
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
                      {stats.collegeAvgScore.toFixed(2)}%
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
                      {stats.collegePassRate.toFixed(2)}%
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
          </View>

          {/* Program Comparison */}
          <View className="px-4 pt-6">
            <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>
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
                  onPress={() => action.onPress ? action.onPress() : router.push(action.route)}
                  className={`w-[48%] rounded-2xl p-5 items-center ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
                className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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

      {/* Create Quiz Modal */}
      <Modal visible={showQuizModal} transparent animationType="slide" onRequestClose={() => setShowQuizModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View className={`rounded-t-3xl px-5 pt-5 pb-8 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
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
