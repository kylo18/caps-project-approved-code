import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import NotificationPanel from '../../../src/features/notifications/components/NotificationPanel';
import HelpCenterModal from '../../../src/features/support/components/HelpCenterModal';
import { showToast } from '../../../src/hooks/useToast';
import { apiRequest } from '../../../src/services/apiClient';
import { getDashboardSummary, getPerformanceTrend } from '../../../src/features/student/insights/services/studentAnalyticsService';
import {
  StudentExamCard,
  StudentHeroDecoration,
  StudentSectionHeader,
  getSubjectVisualVariant,
  studentColors,
} from '../../../src/features/student/ui/StudentUI';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 48;

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
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  // ── Data state ───────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExam, setLoadingExam] = useState(false);
  const [fetchError, setFetchError] = useState('');

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

  useEffect(() => {
    loadDashboard();
    loadUnreadCount();
  }, []);

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
    <View className="flex-1" style={{ backgroundColor: studentColors.surface }}>
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
        <View
          className="px-6 pb-20"
          style={{ backgroundColor: studentColors.orange, paddingTop: insets.top + 14 }}
        >
          <StudentHeroDecoration />

          {/* HERO TOP ROW - Greeting + action buttons */}
          <View className="flex-row items-start justify-between mb-5">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="sunny-outline" size={15} color="#FFD7BC" />
                <Text className="text-[11px] font-medium text-[#FFD7BC] tracking-[1.76px]">
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
                <Ionicons name="help-circle-outline" size={20} color={studentColors.white} />
              </Pressable>

              {/* Notifications with unread badge */}
              <Pressable
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                onPress={() => setNotificationsVisible(true)}
              >
                <Ionicons name="notifications-outline" size={20} color={studentColors.white} />
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
            style={{ backgroundColor: studentColors.pink }}
          >
            <View className="flex-1 pr-4">
              <Text className="text-xs font-medium text-[#C36969] tracking-[1.44px] mb-[6px]">
                RECENT EXAM
              </Text>
              <Text numberOfLines={2} className="text-[17px] font-medium text-[#611212] mb-1">
                {recentExam?.label || 'No exams taken yet'}
              </Text>
              <Text className="text-xs text-[#8A4F4F]">
                {formatShortDate(recentExam?.taken_at)}
              </Text>
            </View>

            <View
              className="w-[58px] h-[58px] rounded-full items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.6)',
                backgroundColor: '#FF8F9D'
              }}
            >
              <Text className="text-[13px] font-bold text-white">{recentExamScore}</Text>
            </View>
          </Pressable>

          {/* FEATURED INSIGHTS CAROUSEL */}
          <View
            className="rounded-[28px] pt-[18px] pb-3 overflow-hidden"
            style={{ backgroundColor: '#F29A34' }}
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
                    <View
                      className="absolute rounded-full"
                      style={{ width: 74, height: 74, backgroundColor: 'rgba(255,255,255,0.14)', left: 16 }}
                    />
                    <View
                      className="absolute rounded-full"
                      style={{ width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.16)', right: 18, bottom: 2 }}
                    />
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: studentColors.white }}
                    >
                      <Ionicons name={slide.icon as keyof typeof Ionicons.glyphMap} size={20} color={studentColors.orange} />
                    </View>
                  </View>

                  <Text className="text-xs font-medium text-white/84 tracking-[1.68px] mb-[6px] text-center">
                    {slide.eyebrow}
                  </Text>
                  <Text className="text-xl font-medium text-white text-center mb-[6px]">
                    {slide.title}
                  </Text>
                  <Text className="text-[13px] text-white/92 text-center mb-4">
                    {slide.detail}
                  </Text>

                  <Pressable
                    className="flex-row items-center gap-2 rounded-full px-4 py-[11px]"
                    style={{ backgroundColor: studentColors.white }}
                    onPress={() => {
                      if (slide.key === 'featured') {
                        router.push('/(auth)/(student)/frequently-mistaken');
                      } else {
                        router.push('/(auth)/(student)/insights');
                      }
                    }}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={18} color={studentColors.orange} />
                    <Text className="text-sm font-bold" style={{ color: studentColors.orange }}>
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
                    backgroundColor: index === activeSlide ? studentColors.white : 'rgba(255,255,255,0.42)',
                  }}
                />
              ))}
            </View>
          </View>
        </View>

        {/* WHITE CONTENT SHEET */}
        <View style={{ backgroundColor: studentColors.orange }}>
          <View
            className="px-6 pt-6 pb-6"
            style={{
              backgroundColor: studentColors.white,
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
              style={{ color: studentColors.textSoft }}
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
                    borderColor: studentColors.border,
                    backgroundColor: studentColors.white,
                  }}
                >
                  <CapsActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={{ color: studentColors.textSoft }}>Loading Subjects...</Text>
                </View>
              ) : loadingExam ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: studentColors.border,
                    backgroundColor: studentColors.white,
                  }}
                >
                  <CapsActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={{ color: studentColors.textSoft }}>Preparing your practice exam...</Text>
                </View>
              ) : fetchError ? (
                <View
                  className="items-center justify-center rounded-3xl py-7 px-5 gap-3"
                  style={{
                    borderWidth: 2,
                    borderColor: studentColors.border,
                    backgroundColor: studentColors.white,
                  }}
                >
                  <Ionicons name="cloud-offline-outline" size={32} color={studentColors.orange} />
                  <Text style={{ color: studentColors.textSoft }}>{fetchError}</Text>
                  <Pressable
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: studentColors.orange }}
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
                    borderColor: studentColors.border,
                    backgroundColor: studentColors.white,
                  }}
                >
                  <Ionicons name="library-outline" size={32} color={studentColors.orange} />
                  <Text style={{ color: studentColors.textSoft }}>No practice subjects are available yet.</Text>
                </View>
              ) : (
                subjects.slice(0, 8).map((subject) => (
                  <StudentExamCard
                    key={subject.subjectID}
                    title={subject.subjectName}
                    subtitle={subject.subjectCode || 'GEN'}
                    iconVariant={getSubjectVisualVariant(subject.subjectName)}
                    subjectCode={subject.subjectCode}
                    onPress={() => handleSubjectPress(subject)}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODALS */}
      <HelpCenterModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  );
}
