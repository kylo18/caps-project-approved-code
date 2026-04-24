import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  studentColors,
  studentShadow,
} from '../../../src/features/student/shared/ui/StudentUI';
import {
  getClassQuizzes,
  getClassHistory,
  unenroll,
  invalidateMyClassesCache,
} from '../../../src/services/studentClassService';

export default function ClassDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { classID, className } = useLocalSearchParams();
  const classId = String(classID);

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [segment, setSegment] = useState<'quizzes' | 'history'>('quizzes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (segment === 'history' && history.length === 0) {
      loadHistory();
    }
  }, [segment]);

  async function loadQuizzes() {
    try {
      const data = await getClassQuizzes(classId);
      const quizList = data?.quizzes || [];
      setQuizzes(Array.isArray(quizList) ? quizList : []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await getClassHistory(classId);
      const historyList = data?.data || data || [];
      setHistory(Array.isArray(historyList) ? historyList : []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    if (segment === 'quizzes') {
      await loadQuizzes();
    } else {
      await loadHistory();
    }
  };

  const handleLeaveClass = () => {
    Alert.alert(
      'Leave Class',
      `Are you sure you want to leave ${className || 'this class'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await unenroll(classId);
              await invalidateMyClassesCache();
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to leave class');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getQuizStatus = (quiz: any) => {
    if (quiz.studentAttempt?.isCompleted) {
      return { label: 'Completed', color: studentColors.success, icon: 'checkmark-circle' as const };
    }
    if (!quiz.isAvailable && quiz.startDate && new Date(quiz.startDate) > new Date()) {
      return { label: 'Upcoming', color: '#F59E0B', icon: 'time' as const };
    }
    if (quiz.isAvailable && quiz.canAttempt && (quiz.remainingAttempts ?? 0) > 0) {
      return { label: 'Available', color: studentColors.orange, icon: 'play-circle' as const };
    }
    if (!quiz.canAttempt && quiz.availabilityMessage) {
      return { label: 'Locked', color: studentColors.textSoft, icon: 'lock-closed' as const };
    }
    return { label: 'Unavailable', color: studentColors.textSoft, icon: 'close-circle' as const };
  };

  const categorizedQuizzes = useMemo(() => {
    const upcoming: any[] = [];
    const available: any[] = [];
    const completed: any[] = [];
    const locked: any[] = [];

    quizzes.forEach((quiz) => {
      const status = getQuizStatus(quiz);
      if (status.label === 'Upcoming') upcoming.push(quiz);
      else if (status.label === 'Available') available.push(quiz);
      else if (status.label === 'Completed') completed.push(quiz);
      else locked.push(quiz);
    });

    return { upcoming, available, completed, locked };
  }, [quizzes]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <StatusBar style="light" />
        <CapsActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* ── Orange Hero Header ─────────────────────────────────────────── */}
      <View className="px-6 pb-[42px]" style={{ paddingTop: insets.top + 12, backgroundColor: studentColors.orange }}>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text
          className="text-white"
          style={{ fontFamily: 'Rubik', fontSize: 24, fontWeight: '600', lineHeight: 30 }}
        >
          {className || 'Class Detail'}
        </Text>

        <Pressable
          onPress={handleLeaveClass}
          disabled={leaving}
          className="mt-4 self-start flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', gap: 6, opacity: leaving ? 0.7 : 1 }}
        >
          <Ionicons name="log-out-outline" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'Rubik', fontSize: 12, fontWeight: '500' }}>
            Leave Class
          </Text>
        </Pressable>
      </View>

      {/* ── White Content Sheet ────────────────────────────────────────── */}
      <View className="flex-1 bg-white rounded-t-[34px] -mt-7 px-6 pt-6 pb-7">
        {/* Segmented Control */}
        <View
          className="flex-row rounded-2xl p-1 mb-5"
          style={{ backgroundColor: studentColors.surfaceSoft }}
        >
          {(['quizzes', 'history'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSegment(s)}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{ backgroundColor: segment === s ? '#fff' : 'transparent', ...studentShadow }}
            >
              <Text
                style={{
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  fontWeight: segment === s ? '600' : '500',
                  color: segment === s ? studentColors.orange : studentColors.textSoft,
                }}
              >
                {s === 'quizzes' ? 'Quizzes' : 'History'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColors.orange} />}
        >
          {segment === 'quizzes' ? (
            <QuizzesList
              categorized={categorizedQuizzes}
              formatDate={formatDate}
              getQuizStatus={getQuizStatus}
              onStartQuiz={(quiz) => {
                router.push({
                  pathname: '/(auth)/(student)/class-quiz-start',
                  params: {
                    classPersonalQuizID: String(quiz.classPersonalQuizID),
                    classID: classId,
                    quizName: quiz.quizName || quiz.personalQuiz?.title || 'Quiz',
                  },
                });
              }}
              onReviewQuiz={(quiz) => {
                const attemptId = quiz.studentAttempt?.attemptID;
                if (attemptId) {
                  router.push({
                    pathname: '/(auth)/(student)/class-quiz-result',
                    params: {
                      resultID: String(attemptId),
                      quizName: quiz.quizName || quiz.personalQuiz?.title || 'Quiz',
                    },
                  });
                }
              }}
            />
          ) : (
            <HistoryList history={history} formatDate={formatDate} />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuizzesList({
  categorized,
  formatDate,
  getQuizStatus,
  onStartQuiz,
  onReviewQuiz,
}: {
  categorized: { upcoming: any[]; available: any[]; completed: any[]; locked: any[] };
  formatDate: (d: string | null) => string;
  getQuizStatus: (q: any) => { label: string; color: string; icon: any };
  onStartQuiz: (q: any) => void;
  onReviewQuiz: (q: any) => void;
}) {
  const renderQuizCard = (quiz: any, index: number) => {
    const status = getQuizStatus(quiz);
    const isAvailable = status.label === 'Available';
    const isCompleted = status.label === 'Completed';
    const deadline = quiz.deadlineDate || quiz.settings?.endTime;
    const attemptsInfo = quiz.maxAttempts
      ? `${quiz.remainingAttempts ?? 0} of ${quiz.maxAttempts} attempts left`
      : '';

    return (
      <View
        key={`${quiz.classPersonalQuizID}-${index}`}
        className="rounded-[22px] border-2 px-4 py-3.5 bg-white mb-3"
        style={{ borderColor: studentColors.border, ...studentShadow }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text
              numberOfLines={1}
              style={{
                color: studentColors.text,
                fontFamily: 'Rubik',
                fontSize: 16,
                fontWeight: '600',
                lineHeight: 22,
              }}
            >
              {quiz.quizName || quiz.personalQuiz?.title || 'Untitled Quiz'}
            </Text>
            {deadline ? (
              <Text
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 12,
                  fontWeight: '400',
                  lineHeight: 18,
                  marginTop: 2,
                }}
              >
                Due {formatDate(deadline)}
              </Text>
            ) : null}
            {attemptsInfo ? (
              <Text
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 11,
                  fontWeight: '400',
                  lineHeight: 16,
                  marginTop: 2,
                }}
              >
                {attemptsInfo}
              </Text>
            ) : null}
          </View>
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: `${status.color}15` }}
          >
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text
              className="ml-1"
              style={{
                color: status.color,
                fontFamily: 'Rubik',
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {isAvailable && (
          <Pressable
            onPress={() => onStartQuiz(quiz)}
            className="mt-3 rounded-xl py-2.5 items-center"
            style={{ backgroundColor: studentColors.orange }}
          >
            <Text style={{ color: '#fff', fontFamily: 'Rubik', fontSize: 14, fontWeight: '600' }}>
              Start Quiz
            </Text>
          </Pressable>
        )}

        {isCompleted && quiz.studentAttempt && (
          <Pressable
            onPress={() => onReviewQuiz(quiz)}
            className="mt-3 rounded-xl py-2.5 items-center border-2"
            style={{ borderColor: studentColors.border, backgroundColor: studentColors.surfaceSoft }}
          >
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="eye-outline" size={16} color={studentColors.orange} />
              <Text style={{ color: studentColors.orange, fontFamily: 'Rubik', fontSize: 14, fontWeight: '600' }}>
                Review · {Math.round(quiz.studentAttempt.accuracy ?? 0)}%
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View>
      {categorized.available.length > 0 && (
        <>
          <SectionHeader icon="play-circle" title="Available" color={studentColors.orange} />
          {categorized.available.map(renderQuizCard)}
        </>
      )}

      {categorized.upcoming.length > 0 && (
        <>
          <SectionHeader icon="time" title="Upcoming" color="#F59E0B" />
          {categorized.upcoming.map(renderQuizCard)}
        </>
      )}

      {categorized.completed.length > 0 && (
        <>
          <SectionHeader icon="checkmark-circle" title="Completed" color={studentColors.success} />
          {categorized.completed.map(renderQuizCard)}
        </>
      )}

      {categorized.locked.length > 0 && (
        <>
          <SectionHeader icon="lock-closed" title="Locked" color={studentColors.textSoft} />
          {categorized.locked.map(renderQuizCard)}
        </>
      )}

      {categorized.available.length === 0 &&
        categorized.upcoming.length === 0 &&
        categorized.completed.length === 0 &&
        categorized.locked.length === 0 && (
          <EmptyState icon="school-outline" message="No quizzes assigned to this class yet." />
        )}
    </View>
  );
}

function HistoryList({ history, formatDate }: { history: any[]; formatDate: (d: string | null) => string }) {
  if (history.length === 0) {
    return <EmptyState icon="time-outline" message="No quiz history for this class yet." />;
  }

  return (
    <View className="gap-3">
      {history.map((item: any, index: number) => (
        <View
          key={`${item.attemptID || index}-${index}`}
          className="rounded-[22px] border-2 px-4 py-3.5 bg-white"
          style={{ borderColor: studentColors.border, ...studentShadow }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text
                numberOfLines={1}
                style={{
                  color: studentColors.text,
                  fontFamily: 'Rubik',
                  fontSize: 15,
                  fontWeight: '500',
                  lineHeight: 22,
                }}
              >
                {item.quizName || item.personalQuiz?.title || 'Quiz'}
              </Text>
              <Text
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 12,
                  fontWeight: '400',
                  lineHeight: 18,
                  marginTop: 2,
                }}
              >
                {formatDate(item.completedAt || item.startedAt)}
              </Text>
            </View>
            <Text
              style={{
                color: item.accuracy >= 70 ? studentColors.success : item.accuracy >= 50 ? '#856404' : '#EF4444',
                fontFamily: 'Rubik',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              {Math.round(item.accuracy ?? 0)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionHeader({ icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2 mt-5 mb-3">
      <Ionicons name={icon} size={18} color={color} />
      <Text
        style={{
          color: studentColors.text,
          fontFamily: 'Rubik',
          fontSize: 14,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View
      className="items-center justify-center gap-2.5 rounded-3xl border-2 py-8 px-5 bg-white mt-4"
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      <Ionicons name={icon} size={32} color={studentColors.orange} />
      <Text
        className="text-center"
        style={{
          color: studentColors.textSoft,
          fontFamily: 'Rubik',
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
