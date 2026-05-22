import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import DailyMotivationModal from '../../../src/features/student/shared/components/DailyMotivationModal';
import { fetchMotivationQuote, type MotivationQuote } from '../../../src/features/student/insights/services/motivationQuoteService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationPanel from '../../../src/features/notifications/components/NotificationPanel';
import HelpCenterModal from '../../../src/features/support/components/HelpCenterModal';
import { showToast } from '../../../src/hooks/useToast';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getDashboardSummary, getPerformanceTrend } from '../../../src/features/student/insights/services/studentAnalyticsService';
import {
  StudentExamCard,
  StudentHeroDecoration,
  StudentSectionHeader,
  getSubjectVisualVariant,
  getStudentColors,
  getStudentShadow,
} from '../../../src/features/student/ui/StudentUI';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 48;
let hasShownMotivationThisSession = false;

const getLocalDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
};

const formatShortDate = (value?: string | null) => {
  if (!value) {
    return 'Start a practice exam today';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Start a practice exam today';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function StudentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  // ── Data state ───────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExam, setLoadingExam] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // ── Motivation modal state ──────────────────────────────────────────────
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationQuote, setMotivationQuote] = useState<MotivationQuote | null>(null);

  // ── Carousel / notification state ────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showHelp, setShowHelp] = useState(false);

  const carouselRef = useRef<ScrollView>(null);

  const firstName = user?.firstName || user?.name || 'Student';

  const recentExam = trend[0];
  const recentExamScore =
    recentExam?.score_percentage != null ? `${Math.round(recentExam.score_percentage)}%` : '--';

  const slides = useMemo(
    () => [
      {
        key: 'featured',
        eyebrow: 'FEATURED',
        title:
          summary?.frequently_mistaken_questions_count != null
            ? `${summary.frequently_mistaken_questions_count} items to review`
            : 'Keep building your momentum',
        detail: 'Revisit the questions that still need attention and tighten your weak spots.',
        icon: 'sparkles',
        actionLabel: 'Review Now',
      },
      {
        key: 'average',
        eyebrow: 'AVERAGE SCORE',
        title:
          summary?.average_score != null ? `${Math.round(summary.average_score)}% average score` : 'No score yet',
        detail: 'Your latest practice sessions are contributing to a stronger average.',
        icon: 'trending-up',
        actionLabel: 'Open Stats',
      },
      {
        key: 'weakest',
        eyebrow: 'WEAKEST TOPIC',
        title: summary?.weakest_topic?.name || 'No weakest topic yet',
        detail: summary?.weakest_topic
          ? `${Math.round((summary.weakest_topic.error_rate ?? 0) * 100)}% error rate`
          : 'Complete more quizzes to unlock topic-level insights.',
        icon: 'alert-circle',
        actionLabel: 'See Breakdown',
      },
    ],
    [summary]
  );

  const subjectStatsMap = useMemo(() => {
    const stats: Record<number, { attemptsCount: number; averageScore: number; progress: number }> = {};
    if (!Array.isArray(trend)) return stats;

    const groups: Record<number, number[]> = {};
    trend.forEach((item) => {
      const subId = item?.subjectID ?? item?.subject_id;
      if (subId != null) {
        const score = item?.score_percentage ?? 0;
        const numericId = Number(subId);
        if (!groups[numericId]) {
          groups[numericId] = [];
        }
        groups[numericId].push(score);
      }
    });

    Object.keys(groups).forEach((subIdKey) => {
      const subId = Number(subIdKey);
      const scores = groups[subId];
      const attemptsCount = scores.length;
      const totalScore = scores.reduce((sum, val) => sum + val, 0);
      const averageScore = attemptsCount > 0 ? totalScore / attemptsCount : 0;
      const progress = averageScore / 100;
      stats[subId] = {
        attemptsCount,
        averageScore,
        progress,
      };
    });

    return stats;
  }, [trend]);

  useEffect(() => {
    loadDashboard();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    checkMotivation();
  }, []);

  async function checkMotivation() {
    try {
      const todayKey = getLocalDateKey();
      const [enabledStr, suppressedDate] = await Promise.all([
        AsyncStorage.getItem('student_motivation_enabled'),
        AsyncStorage.getItem('student_motivation_suppressed_date'),
      ]);

      // Pre-fetch quote so it's ready
      const quote = await fetchMotivationQuote();
      setMotivationQuote(quote);

      if (enabledStr === 'false') return;
      if (suppressedDate === todayKey) return;
      if (hasShownMotivationThisSession) return;

      hasShownMotivationThisSession = true;
      setShowMotivation(true);
    } catch (error) {
      console.warn('[Motivation] Failed to show modal:', error);
    }
  }

  const handleDismissMotivation = (suppressToday: boolean) => {
    if (suppressToday) {
      AsyncStorage.setItem('student_motivation_suppressed_date', getLocalDateKey()).catch(() => {});
    }
    setShowMotivation(false);
  };

  const handleShowMotivation = () => {
    if (motivationQuote) setShowMotivation(true);
  };

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setActiveSlide((current) => {
        const next = (current + 1) % slides.length;
        carouselRef.current?.scrollTo({ x: next * CAROUSEL_WIDTH, animated: true });
        return next;
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [slides.length]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [subjectsResponse, summaryResponse, trendResponse] = await Promise.all([
        apiRequest('/api/student/practice-subjects'),
        getDashboardSummary(),
        getPerformanceTrend(),
      ]);

      const nextSubjects = Array.isArray(subjectsResponse?.data)
        ? subjectsResponse.data
        : Array.isArray(subjectsResponse)
          ? subjectsResponse
          : [];

      setSubjects(nextSubjects);
      setSummary(summaryResponse?.data ?? null);
      setTrend(Array.isArray(trendResponse?.data) ? trendResponse.data : []);
      setFetchError('');
    } catch (error: unknown) {
      console.error('Failed to load student dashboard:', error);
      setFetchError(error instanceof Error ? error.message : 'Unable to load live exams.');
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const response = await apiRequest('/api/notifications/unread-count');
      setUnreadCount(
        Number(
          response?.unreadCount ??
          response?.unread_count ??
          response?.count ??
          response?.data?.unreadCount ??
          0
        )
      );
    } catch (error) {
      setUnreadCount(0);
    }
  }

  async function handleSubjectPress(subject: any) {
    setLoadingExam(true);

    try {
      const data = await apiRequest(`/api/practice-exam/generate/${subject.subjectID}`);

      if (!data?.questions || data.questions.length === 0) {
        throw new Error('No questions available for this subject.');
      }

      router.push({
        pathname: '/(auth)/practice-exam/info',
        params: {
          subjectID: subject.subjectID,
          subjectName: data.subjectName || subject.subjectName,
          totalItems: data.questions.length,
          totalPoints: data.totalPoints || data.questions.length,
          enableTimer: Boolean(data.enableTimer).toString(),
          durationMinutes: data.durationMinutes?.toString() || '60',
        },
      });
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Unable to load exam. Please try again.', 'error');
    } finally {
      setLoadingExam(false);
    }
  }

  function handleCarouselScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    if (nextIndex !== activeSlide) {
      setActiveSlide(nextIndex);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <StatusBar style="light" />

      {/* NOTIFICATIONS PANEL */}
      <NotificationPanel
        visible={notificationsVisible}
        onClose={() => {
          setNotificationsVisible(false);
          loadUnreadCount();
        }}
      />

      {/* SCROLLABLE CONTENT - Orange hero header + white sheet with live exam cards */}
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ORANGE HERO HEADER */}
        <LinearGradient
          colors={isDark ? ['#1A1008', '#0F0F0F'] : ['#FFB15C', '#FE6902']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pb-20"
          style={{ paddingTop: insets.top + 14 }}
        >
          <StudentHeroDecoration />
          {isDark ? (
            <View
              pointerEvents="none"
              className="absolute rounded-full"
              style={{
                width: 220,
                height: 220,
                top: -72,
                right: -60,
                backgroundColor: colors.glow,
                opacity: 0.7,
              }}
            />
          ) : null}

          {/* HERO TOP ROW - Greeting + action buttons */}
          <View className="flex-row items-start justify-between mb-5">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="sunny-outline" size={15} color={colors.headerTextSoft} />
                <Text className="text-[11px] font-medium tracking-[1.76px]" style={{ color: colors.headerTextSoft }}>
                  {getGreeting()}
                </Text>
              </View>
              <Text className="text-[30px] font-medium text-white">{firstName}</Text>
            </View>

            {/* Action buttons: help center, notifications */}
            <View className="flex-row items-center gap-3">
              {/* Help Center */}
              <Pressable
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                onPress={() => setShowHelp(true)}
              >
                <Ionicons name="help-circle-outline" size={20} color={colors.white} />
              </Pressable>

              {/* Motivation quote */}
              <Pressable
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                onPress={handleShowMotivation}
              >
                <Ionicons name="sparkles" size={20} color={colors.white} />
              </Pressable>

              {/* Notifications with unread badge */}
              <Pressable
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                onPress={() => setNotificationsVisible(true)}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
                {unreadCount > 0 ? (
                  <View
                    className="absolute items-center justify-center rounded-full"
                    style={{
                      top: -4,
                      right: -3,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 4,
                      backgroundColor: '#EA4335'
                    }}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {Math.min(unreadCount, 99)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

            </View>
          </View>

          {/* RECENT EXAM CARD */}
          <Pressable
            onPress={() => {
              if (recentExam?.result_id) {
                router.push({
                  pathname: '/(auth)/practice-exam/results',
                  params: { resultId: recentExam.result_id, origin: 'home' },
                });
              } else {
                router.push('/(auth)/(student)/insights');
              }
            }}
            className="flex-row items-center justify-between rounded-3xl px-5 py-[18px] mb-[18px]"
            style={{ backgroundColor: colors.examCard, borderWidth: isDark ? 1 : 0, borderColor: colors.border }}
          >
            <View className="flex-1 pr-4">
              <Text className="text-xs font-medium tracking-[1.44px] mb-[6px]" style={{ color: isDark ? colors.pinkSoft : '#C36969' }}>
                RECENT EXAM
              </Text>
              <Text numberOfLines={2} className="text-[17px] font-medium mb-1" style={{ color: colors.examText }}>
                {recentExam?.label || 'No exams taken yet'}
              </Text>
              <Text className="text-xs" style={{ color: isDark ? colors.textSoft : '#8A4F4F' }}>
                {formatShortDate(recentExam?.taken_at)}
              </Text>
            </View>

            <View
              className="w-[58px] h-[58px] rounded-full items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: isDark ? 'rgba(255,107,138,0.26)' : 'rgba(255,255,255,0.6)',
                backgroundColor: isDark ? 'rgba(255,107,138,0.22)' : '#FF8F9D'
              }}
            >
              <Text className="text-[13px] font-bold text-white">{recentExamScore}</Text>
            </View>
          </Pressable>

          {/* FEATURED INSIGHTS CAROUSEL */}
          <View
            className="rounded-[28px] pt-[18px] pb-3 overflow-hidden"
            style={{ backgroundColor: colors.statsCard, borderWidth: isDark ? 1 : 0, borderColor: colors.border, ...shadow }}
          >
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
              contentContainerStyle={{ alignItems: 'stretch' }}
            >
              {slides.map((slide) => (
                <View key={slide.key} style={{ width: CAROUSEL_WIDTH }} className="px-[26px] items-center">
                  <View className="w-[120px] h-[76px] mb-2 items-center justify-center">
                    <View className="absolute rounded-full" style={{ width: 74, height: 74, backgroundColor: colors.glow, left: 16 }} />
                    <View
                      className="absolute rounded-full"
                      style={{ width: 46, height: 46, backgroundColor: isDark ? 'rgba(255,140,0,0.16)' : 'rgba(254,105,2,0.10)', right: 18, bottom: 2 }}
                    />
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.card }}
                    >
                      <Ionicons name={slide.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.orange} />
                    </View>
                  </View>

                  <Text className="text-xs font-medium tracking-[1.68px] mb-[6px] text-center" style={{ color: isDark ? colors.headerTextSoft : '#A55300' }}>
                    {slide.eyebrow}
                  </Text>
                  <Text className="text-xl font-medium text-center mb-[6px]" style={{ color: colors.text }}>
                    {slide.title}
                  </Text>
                  <Text className="text-[13px] text-center mb-4" style={{ color: colors.textSoft }}>
                    {slide.detail}
                  </Text>

                  <Pressable
                    className="flex-row items-center gap-2 rounded-full px-4 py-[11px]"
                    style={{ backgroundColor: colors.cardSoft }}
                    onPress={() => {
                      if (slide.key === 'featured') {
                        router.push('/(auth)/(student)/frequently-mistaken');
                      } else {
                        router.push('/(auth)/(student)/insights');
                      }
                    }}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.orange} />
                    <Text className="text-sm font-bold" style={{ color: colors.orange }}>
                      {slide.actionLabel}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View className="flex-row justify-center items-center gap-2 mt-3">
              {slides.map((slide, index) => (
                <View
                  key={slide.key}
                  className="rounded-full"
                  style={{
                    width: index === activeSlide ? 20 : 7,
                    height: 7,
                    backgroundColor: index === activeSlide ? colors.orange : colors.border,
                  }}
                />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* WHITE CONTENT SHEET */}
        <View style={{ backgroundColor: isDark ? colors.page : colors.header }}>
          <View
            className="px-6 pt-6 pb-6"
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 34,
              borderTopRightRadius: 34,
              marginTop: -32,
              minHeight: 360,
            }}
          >
            <StudentSectionHeader
              title="Available Subjects"
              actionLabel="Search"
              onActionPress={() => router.push('/(auth)/(student)/search')}
            />
            <Text
              className="text-sm mt-1"
              style={{ color: colors.textSoft }}
            >
              Continue practicing from your available subjects.
            </Text>

            {/* Live Exam Cards */}
            <View className="mt-[18px] gap-[14px]">
              {loading ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <CapsActivityIndicator size="large" color={colors.orange} />
                  <Text style={{ color: colors.textSoft }}>Loading Subjects...</Text>
                </View>
              ) : loadingExam ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <CapsActivityIndicator size="large" color={colors.orange} />
                  <Text style={{ color: colors.textSoft }}>Preparing your practice exam...</Text>
                </View>
              ) : fetchError ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <Ionicons name="cloud-offline-outline" size={32} color={colors.orange} />
                  <Text style={{ color: colors.textSoft }}>{fetchError}</Text>
                  <Pressable
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: colors.orange }}
                    onPress={loadDashboard}
                  >
                    <Text className="text-sm font-bold text-white">Retry</Text>
                  </Pressable>
                </View>
              ) : subjects.length === 0 ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <Ionicons name="library-outline" size={32} color={colors.orange} />
                  <Text style={{ color: colors.textSoft }}>No practice subjects are available yet.</Text>
                </View>
              ) : (
                subjects.slice(0, 8).map((subject) => {
                  const stats = subjectStatsMap[Number(subject.subjectID)];
                  return (
                    <StudentExamCard
                      key={subject.subjectID}
                      title={subject.subjectName}
                      subtitle={subject.subjectCode || 'GEN'}
                      iconVariant={getSubjectVisualVariant(subject.subjectName)}
                      subjectCode={subject.subjectCode}
                      onPress={() => handleSubjectPress(subject)}
                      attemptsCount={stats?.attemptsCount}
                      averageScore={stats?.averageScore}
                      progress={stats?.progress}
                      programName={subject.programName}
                      yearLevel={subject.yearLevel}
                    />
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODALS */}
      <DailyMotivationModal
        visible={showMotivation}
        quote={motivationQuote}
        onDismiss={handleDismissMotivation}
      />
      <HelpCenterModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  );
}
