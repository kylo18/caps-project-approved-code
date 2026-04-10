import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../src/store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import NotificationPanel from '../../../src/components/NotificationPanel';
import EditProfileModal from '../../../src/components/EditProfileModal';
import ConfirmModal from '../../../src/components/ConfirmModal';
import HelpCenterModal from '../../../src/components/HelpCenterModal';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { apiRequest } from '../../../src/services/apiClient';
import { getDashboardSummary, getPerformanceTrend } from '../../../src/services/studentAnalyticsService';
import {
  StudentAvatar,
  StudentExamCard,
  StudentHeroDecoration,
  StudentSectionHeader,
  getSubjectVisualVariant,
  studentColors,
  studentShadow,
} from '../../../src/student/ui';

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
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;
  const { theme, toggleTheme } = useTheme();

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

  // ── Profile menu state ───────────────────────────────────────────────────
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const carouselRef = useRef<ScrollView>(null);

  const firstName = user?.firstName || user?.name || 'Student';
  const displayName =
    user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
  const email = user?.email || '';
  const initials = `${firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';

  const recentExam = trend[0];
  const recentExamScore =
    recentExam?.score_percentage != null ? `${Math.round(recentExam.score_percentage)}%` : '--';

  const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
  const avatarColor = avatarPalette[(user?.userID || 0) % avatarPalette.length];

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      dispatch(logout());
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        actionLabel: 'View Insights',
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
    } catch (error: any) {
      console.error('Failed to load student dashboard:', error);
      setFetchError(error?.message || 'Unable to load live exams.');
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
          enableTimer: data.enableTimer?.toString() || 'false',
          durationMinutes: data.durationMinutes?.toString() || '60',
        },
      });
    } catch (error: any) {
      showToast(error?.message || 'Unable to load exam. Please try again.', 'error');
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
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ───────────────────────────────────────────────────────────────────
          NOTIFICATIONS PANEL
          Slide-up notification drawer triggered from the bell icon.
          ─────────────────────────────────────────────────────────────────── */}
      <NotificationPanel
        visible={notificationsVisible}
        onClose={() => {
          setNotificationsVisible(false);
          loadUnreadCount();
        }}
      />

      {/* ───────────────────────────────────────────────────────────────────
          SCROLLABLE CONTENT
          Orange hero header + white sheet with live exam cards.
          ─────────────────────────────────────────────────────────────────── */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ─────────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Displays greeting, student name, and three action buttons:
              1. Help Center (opens FAQ & support modal)
              2. Notifications (opens notification panel with unread badge)
              3. Profile Avatar (opens orange-themed profile menu)
            ───────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <StudentHeroDecoration />

          {/* ───────────────────────────────────────────────────────────────
              HERO TOP ROW
              Time-based greeting + student name on the left.
              Three action icons on the right: help, notifications, avatar.
              ─────────────────────────────────────────────────────────────── */}
          <View style={styles.heroTopRow}>
            <View>
              <View style={styles.greetingRow}>
                <Ionicons name="sunny-outline" size={15} color="#FFD7BC" />
                <Text style={styles.greetingText}>{getGreeting()}</Text>
              </View>
              <Text style={styles.heroName}>{firstName}</Text>
            </View>

            {/* Action buttons: help center, notifications, profile menu */}
            <View style={styles.heroActions}>
              {/* Help Center */}
              <Pressable style={styles.iconButton} onPress={() => setShowHelp(true)}>
                <Ionicons name="help-circle-outline" size={20} color={studentColors.white} />
              </Pressable>

              {/* Notifications with unread badge */}
              <Pressable style={styles.iconButton} onPress={() => setNotificationsVisible(true)}>
                <Ionicons name="notifications-outline" size={20} color={studentColors.white} />
                {unreadCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{Math.min(unreadCount, 99)}</Text>
                  </View>
                ) : null}
              </Pressable>

              {/* Profile Avatar - taps open the orange profile menu */}
              <Pressable onPress={() => setShowProfileMenu(true)}>
                <StudentAvatar label={displayName} size={52} index={1} style={styles.profileAvatar} />
              </Pressable>
            </View>
          </View>

          {/* ───────────────────────────────────────────────────────────────
              RECENT EXAM CARD
              Tapping navigates to the most recent exam result page,
              or falls back to the Insights screen if no exams exist yet.
              ─────────────────────────────────────────────────────────────── */}
          <Pressable
            onPress={() => {
              if (recentExam?.result_id) {
                router.push({
                  pathname: '/(auth)/practice-exam/results',
                  params: { resultId: recentExam.result_id },
                });
              } else {
                router.push('/(auth)/(student)/insights');
              }
            }}
            style={({ pressed }) => [styles.recentCard, pressed ? { opacity: 0.96 } : null]}
          >
            <View style={styles.recentCopy}>
              <Text style={styles.recentLabel}>RECENT EXAM</Text>
              <Text numberOfLines={2} style={styles.recentTitle}>
                {recentExam?.label || 'No exams taken yet'}
              </Text>
              <Text style={styles.recentDate}>{formatShortDate(recentExam?.taken_at)}</Text>
            </View>

            <View style={styles.scoreRing}>
              <Text style={styles.scoreRingText}>{recentExamScore}</Text>
            </View>
          </Pressable>

          {/* ───────────────────────────────────────────────────────────────
              FEATURED INSIGHTS CAROUSEL
              Auto-scrolling cards (every 4.2s) showing 3 analytics slides:
                1. Frequently mistaken questions count
                2. Average score across all practice exams
                3. Weakest topic with error rate
              Each card links to the Insights screen.
              ─────────────────────────────────────────────────────────────── */}
          <View style={styles.featuredCard}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
              contentContainerStyle={styles.carouselTrack}
            >
              {slides.map((slide) => (
                <View key={slide.key} style={styles.carouselSlide}>
                  <View style={styles.slideArt}>
                    <View style={styles.slideOrbLarge} />
                    <View style={styles.slideOrbSmall} />
                    <View style={styles.slideAvatar}>
                      <Ionicons name={slide.icon as any} size={20} color={studentColors.orange} />
                    </View>
                  </View>

                  <Text style={styles.slideEyebrow}>{slide.eyebrow}</Text>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideDetail}>{slide.detail}</Text>

                  <Pressable style={styles.slideButton} onPress={() => router.push('/(auth)/(student)/insights')}>
                    <Ionicons name="arrow-forward-circle-outline" size={18} color={studentColors.orange} />
                    <Text style={styles.slideButtonText}>{slide.actionLabel}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View style={styles.carouselDots}>
              {slides.map((slide, index) => (
                <View key={slide.key} style={[styles.carouselDot, index === activeSlide ? styles.carouselDotActive : null]} />
              ))}
            </View>
          </View>
        </View>

        {/* ─────────────────────────────────────────────────────────────────
            WHITE CONTENT SHEET
            Rounded-top card containing the "Live Exams" section header
            and a scrollable list of subject exam cards (up to 8).
            Tapping a card triggers exam generation via the backend API.
            ───────────────────────────────────────────────────────────────── */}
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            {/* Section header with "Search" action linking to the Search tab */}
            <StudentSectionHeader
              title="Live Exams"
              actionLabel="Search"
              onActionPress={() => router.push('/(auth)/(student)/search')}
            />
            <Text style={styles.sheetSubtitle}>Continue practicing from your available subjects.</Text>

            {/* ── Live Exam Cards: shows loading, error, empty, or up to 8 subjects ── */}
            <View style={styles.listWrap}>
              {loading ? (
                <View style={styles.feedbackCard}>
                  <ActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={styles.feedbackText}>Loading live exams...</Text>
                </View>
              ) : loadingExam ? (
                <View style={styles.feedbackCard}>
                  <ActivityIndicator size="large" color={studentColors.orange} />
                  <Text style={styles.feedbackText}>Preparing your practice exam...</Text>
                </View>
              ) : fetchError ? (
                <View style={styles.feedbackCard}>
                  <Ionicons name="cloud-offline-outline" size={32} color={studentColors.orange} />
                  <Text style={styles.feedbackText}>{fetchError}</Text>
                  <Pressable style={styles.retryButton} onPress={loadDashboard}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              ) : subjects.length === 0 ? (
                <View style={styles.feedbackCard}>
                  <Ionicons name="library-outline" size={32} color={studentColors.orange} />
                  <Text style={styles.feedbackText}>No practice subjects are available yet.</Text>
                </View>
              ) : (
                subjects.slice(0, 8).map((subject) => (
                  <StudentExamCard
                    key={subject.subjectID}
                    title={subject.subjectName}
                    subtitle={`${subject.subjectCode || 'GEN'} • ${subject.questionCount || 10} quizzes`}
                    iconVariant={getSubjectVisualVariant(subject.subjectName)}
                    onPress={() => handleSubjectPress(subject)}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ───────────────────────────────────────────────────────────────────
          PROFILE MENU MODAL
          Orange-themed overlay with user info, edit profile, theme toggle,
          and logout. Triggered by tapping the avatar in the hero header.
          ─────────────────────────────────────────────────────────────────── */}
      <Modal visible={showProfileMenu} transparent animationType="fade">
        <Pressable style={styles.profileMenuOverlay} onPress={() => setShowProfileMenu(false)}>
          <Pressable activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.profileMenuCard}>
              <View style={styles.profileMenuHeader}>
                <View style={[styles.profileMenuAvatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.profileMenuAvatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={styles.profileMenuName}>{firstName} {user?.lastName || ''}</Text>
                  <Text style={styles.profileMenuEmail} numberOfLines={1}>{email}</Text>
                </View>
              </View>

              <Pressable style={styles.profileMenuItem} onPress={() => { setShowProfileMenu(false); setShowEditProfile(true); }}>
                <Ionicons name="person" size={20} color="#fff" />
                <Text style={styles.profileMenuItemText}>Edit Profile</Text>
              </Pressable>

              <Pressable style={styles.profileMenuItem} onPress={() => { setShowProfileMenu(false); toggleTheme(); }}>
                <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color="#fff" />
                <Text style={styles.profileMenuItemText}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
              </Pressable>

              <Pressable style={[styles.profileMenuItem, styles.profileMenuLogout]} onPress={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}>
                <Ionicons name="log-out" size={20} color="#FFD7BC" />
                <Text style={styles.profileMenuLogoutText}>Log Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────
          SECONDARY MODALS
          Rendered at root level so they overlay all content:
            - NotificationPanel: fetches from /api/notifications
            - EditProfileModal: user profile editing
            - HelpCenterModal: FAQs + support ticket form
            - ConfirmModal: logout confirmation
          ─────────────────────────────────────────────────────────────────── */}
      <NotificationPanel
        visible={notificationsVisible}
        onClose={() => {
          setNotificationsVisible(false);
          loadUnreadCount();
        }}
      />
      <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} user={user} />
      <HelpCenterModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.surface,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    backgroundColor: studentColors.orange,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greetingText: {
    color: '#FFD7BC',
    fontFamily: 'Rubik',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 1.76,
  },
  heroName: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 36,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 10,
    fontWeight: '700',
  },
  recentCard: {
    backgroundColor: studentColors.pink,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  recentCopy: {
    flex: 1,
    paddingRight: 16,
  },
  recentLabel: {
    color: '#C36969',
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 1.44,
    marginBottom: 6,
  },
  recentTitle: {
    color: '#611212',
    fontFamily: 'Rubik',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 4,
  },
  recentDate: {
    color: '#8A4F4F',
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  scoreRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: '#FF8F9D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredCard: {
    backgroundColor: '#F29A34',
    borderRadius: 28,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  carouselTrack: {
    alignItems: 'stretch',
  },
  carouselSlide: {
    width: CAROUSEL_WIDTH,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  slideArt: {
    width: 120,
    height: 76,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideOrbLarge: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.14)',
    left: 16,
  },
  slideOrbSmall: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.16)',
    right: 18,
    bottom: 2,
  },
  slideAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: studentColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideEyebrow: {
    color: 'rgba(255,255,255,0.84)',
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 1.68,
    marginBottom: 6,
  },
  slideTitle: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  slideDetail: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: studentColors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  slideButtonText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  carouselDotActive: {
    width: 20,
    backgroundColor: studentColors.white,
  },
  sheetWrap: {
    backgroundColor: studentColors.orange,
  },
  sheet: {
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    minHeight: 360,
  },
  sheetSubtitle: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 4,
  },
  listWrap: {
    gap: 14,
    marginTop: 18,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingVertical: 28,
    paddingHorizontal: 20,
    ...studentShadow,
  },
  feedbackText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: studentColors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '700',
  },

  // Profile Menu - matches orange hero theme
  profileMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  profileMenuCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: studentColors.orange,
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
  },
  profileMenuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileMenuAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Rubik',
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Rubik',
  },
  profileMenuEmail: {
    fontSize: 13,
    marginTop: 2,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Rubik',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  profileMenuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'Rubik',
  },
  profileMenuLogout: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    marginTop: 8,
    paddingTop: 16,
  },
  profileMenuLogoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFD7BC',
    fontFamily: 'Rubik',
  },
});
