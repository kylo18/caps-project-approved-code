import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CapsActivityIndicator from '../../../../features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../../store/slices/authSlice';
import { logoutUser } from '../../../../utils/logoutUser';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmModal from '../../../../features/core/components/ConfirmModal';
import EditProfileModal from '../../../../features/profile/components/EditProfileModal';
import { useTheme } from '../../../../contexts/ThemeContext';
import { showToast } from '../../../../hooks/useToast';
import { unregisterStoredPushToken } from '../../../../services/pushNotificationService';
import {
  getDashboardSummary,
  getLearningInsights,
  getPerformanceTrend,
  getRecommendations,
  computeTrend,
} from '../services/studentAnalyticsService';
import {
  StudentAvatar,
  StudentHeroDecoration,
  StudentSectionHeader,
  studentColors,
  studentShadow,
} from '../../shared/ui/StudentUI';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const buildDisplayName = (profile: any, fallbackUser: any) =>
  profile?.fullName ||
  [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
  fallbackUser?.fullName ||
  [fallbackUser?.firstName, fallbackUser?.lastName].filter(Boolean).join(' ') ||
  fallbackUser?.name ||
  'Student';

const scoreMeta = (score: number) => {
  if (score >= 70) return { color: studentColors.success };
  if (score >= 50) return { color: '#856404' };
  return { color: '#D32F2F' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  value: string;
  color?: string;
  onPress?: () => void;
}) {
  const content = (
    <View
      className="flex-row items-center rounded-xl px-2.5 py-1.5 border"
      style={{
        backgroundColor: studentColors.surfaceSoft,
        borderColor: studentColors.border,
        borderTopWidth: 2,
        borderTopColor: color ?? studentColors.orange,
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={16} color={color ?? studentColors.orange} />
      <View>
        <Text
          style={{
            color: studentColors.textSoft,
            fontFamily: 'Rubik',
            fontSize: 9,
            fontWeight: '500',
            lineHeight: 12,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: studentColors.text,
            fontFamily: 'Rubik',
            fontSize: 13,
            fontWeight: '700',
            lineHeight: 16,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function TrendBadge({ trend, onPress }: { trend?: string; onPress?: () => void }) {
  const isImproving = trend === 'improving';
  const isDeclining = trend === 'declining';
  const icon = isImproving ? 'trending-up' : isDeclining ? 'trending-down' : 'remove';
  const label = isImproving ? 'Improving' : isDeclining ? 'Declining' : 'Stable';

  const badge = (
    <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)', gap: 5 }}>
      <Ionicons name={icon} size={12} color="#fff" />
      <Text style={{ color: '#fff', fontFamily: 'Rubik', fontSize: 11, fontWeight: '600' }}>{label}</Text>
      <Ionicons name="information-circle-outline" size={11} color="rgba(255,255,255,0.55)" />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {badge}
      </Pressable>
    );
  }
  return badge;
}

function InsightCard({
  icon,
  label,
  description,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-[22px] border-2 px-4 py-3.5 bg-white"
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      <View className="flex-row items-center gap-3.5">
        <View
          className="w-12 h-12 rounded-[16px] items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: studentColors.text,
              fontFamily: 'Rubik',
              fontSize: 15,
              fontWeight: '600',
              lineHeight: 22,
            }}
          >
            {label}
          </Text>
          <Text
            className="mt-0.5"
            style={{
              color: studentColors.textSoft,
              fontFamily: 'Rubik',
              fontSize: 12,
              fontWeight: '400',
              lineHeight: 18,
            }}
          >
            {description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={studentColors.textSoft} />
      </View>
    </Pressable>
  );
}

function TopicCard({
  topic,
  index,
  rate,
  mode,
  isStrong,
}: {
  topic: string;
  index: number;
  rate: number;
  mode: 'card' | 'list';
  isStrong?: boolean;
}) {
  const barColor = isStrong ? studentColors.success : '#EF4444';
  const leftColor = isStrong ? studentColors.success : '#EF4444';

  if (mode === 'list') {
    return (
      <View className="flex-row items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: studentColors.surfaceSoft }}>
        <Text
          numberOfLines={1}
          className="flex-1"
          style={{
            color: studentColors.text,
            fontFamily: 'Rubik',
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 20,
          }}
        >
          {topic}
        </Text>
        <Text
          style={{
            color: isStrong ? studentColors.success : '#EF4444',
            fontFamily: 'Rubik',
            fontSize: 13,
            fontWeight: '700',
            lineHeight: 18,
          }}
        >
          {Math.round(rate * 100)}%{isStrong ? ' Success' : ' Error'}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="rounded-[22px] border-2 px-3 py-2.5 bg-white"
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      <View className="flex-row items-center gap-3.5">
        <View
          className="w-14 h-14 rounded-[18px] items-center justify-center"
          style={{ backgroundColor: isStrong ? '#E8F5E9' : studentColors.surfaceSoft }}
        >
          <Ionicons
            name={isStrong ? 'checkmark-circle-outline' : index % 2 === 0 ? 'calculator-outline' : 'book-outline'}
            size={22}
            color={isStrong ? studentColors.success : studentColors.orange}
          />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={2}
            style={{
              color: studentColors.text,
              fontFamily: 'Rubik',
              fontSize: 16,
              fontWeight: '500',
              lineHeight: 22,
            }}
          >
            {topic}
          </Text>
          <Text
            className="mt-1"
            style={{
              color: studentColors.textSoft,
              fontFamily: 'Rubik',
              fontSize: 12,
              fontWeight: '400',
              lineHeight: 18,
            }}
          >
            {Math.round(rate * 100)}%{isStrong ? ' success rate' : ' error rate'}
          </Text>
        </View>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: studentColors.surfaceSoft }}>
        <View className="h-full rounded-full" style={{ width: `${Math.round(rate * 100)}%`, backgroundColor: barColor }} />
      </View>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View
      className="items-center justify-center gap-2.5 rounded-3xl border-2 py-7 px-5 bg-white"
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      <Ionicons name={icon} size={30} color={studentColors.orange} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentInsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;
  const refreshInFlightRef = useRef(false);

  // ── Data state ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<any>(user);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);

  // Stat explanation modal
  const [showStatModal, setShowStatModal] = useState(false);
  const [statModalTitle, setStatModalTitle] = useState('');
  const [statModalDesc, setStatModalDesc] = useState('');
  const [insightViewMode, setInsightViewMode] = useState<'card' | 'list'>('list');

  // Analytics extensions
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsError, setRecommendationsError] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Compute trend locally from sequential exam comparisons
  const localTrend = useMemo(() => {
    if (!trendData || trendData.length < 2) return 'stable';
    return computeTrend(trendData);
  }, [trendData]);

  const openStatModal = (title: string, description: string) => {
    setStatModalTitle(title);
    setStatModalDesc(description);
    setShowStatModal(true);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  // ── Fetch all analytics data in parallel on mount ───────────────────────
  useEffect(() => {
    loadInsights();
    return () => {
      refreshInFlightRef.current = false;
    };
  }, []);

  async function loadInsights(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      // Phase 1: load summary + insights + trend in parallel (3 calls)
      const [summaryResponse, insightResponse, trendResponse] = await Promise.all([
        getDashboardSummary(),
        getLearningInsights(),
        getPerformanceTrend(),
      ]);

      setSummary(summaryResponse?.data || summaryResponse || {});
      setInsights(insightResponse?.data || insightResponse || {});
      setLoadError(summaryResponse?.error || insightResponse?.error || '');
      setTrendData(trendResponse?.data || []);

      // Phase 2: once trend resolves, fetch recommendations if attemptId is available
      const latestAttempt = trendResponse?.data?.[0];
      const attemptId = latestAttempt?.attempt_id;
      if (attemptId) {
        try {
          setRecommendationsError(false);
          const rec = await getRecommendations(attemptId);
          if (rec.error) {
            setRecommendationsError(true);
            setRecommendations([]);
          } else {
            setRecommendations(rec.data || []);
          }
        } catch {
          setRecommendationsError(true);
          setRecommendations([]);
        }
      } else {
        setRecommendations([]);
        setRecommendationsError(false);
      }

    } catch (error) {
      console.error('Error fetching insights:', error);
      setLoadError('Unable to refresh your insight hub right now.');
    } finally {
      refreshInFlightRef.current = false;
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadInsights({ silent: true });
  };

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    router.replace('/');
  };

  // ── Derived values ──────────────────────────────────────────────────────
  const fullName = buildDisplayName(profile, user);
  const userIdLabel = profile?.userCode || user?.userCode || profile?.userID || user?.userID || 'N/A';
  const email = profile?.email || user?.email || 'No email available';
  const initials =
    `${profile?.firstName?.[0] || user?.firstName?.[0] || ''}${profile?.lastName?.[0] || user?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
  const avatarColor = avatarPalette[(profile?.userID || user?.userID || 0) % avatarPalette.length];

  const weakTopics = useMemo(() => {
    if (Array.isArray(insights?.weak_topics) && insights.weak_topics.length > 0) {
      return insights.weak_topics;
    }
    if (summary?.weakest_topic?.name && summary.weakest_topic.name !== 'N/A') {
      return [{ topic: summary.weakest_topic.name, error_rate: summary.weakest_topic.error_rate ?? 0 }];
    }
    return [];
  }, [insights?.weak_topics, summary?.weakest_topic]);

  const strongTopics = useMemo(() => {
    if (Array.isArray(insights?.strong_topics) && insights.strong_topics.length > 0) {
      return insights.strong_topics;
    }
    if (summary?.strongest_subject) {
      return [{ topic: summary.strongest_subject, success_rate: 1 }];
    }
    return [];
  }, [insights?.strong_topics, summary?.strongest_subject]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.white }}>
        <StatusBar style="dark" />
        <CapsActivityIndicator size="large" color={studentColors.orange} />
        <Text className="mt-4 text-sm" style={{ color: studentColors.textSoft, fontFamily: 'Rubik' }}>
          Loading Profile...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColors.orange} />}
      >
        {/* ── Orange Hero Header ─────────────────────────────────────────── */}
        <LinearGradient
          colors={['#FF8C3A', '#FE6902', '#E55D00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pb-[48px]"
          style={{ paddingTop: insets.top + 12 }}
        >
          <StudentHeroDecoration />

          {/* ── Action row ───────────────────────────────────────────────── */}
          <View className="flex-row items-center justify-between mb-8">
            <Pressable
              onPress={() => setShowProfileMenu(true)}
              hitSlop={10}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
            >
              <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.88)" />
            </Pressable>

            <Pressable
              onPress={() => setShowEditProfile(true)}
              hitSlop={10}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
            >
              <Ionicons name="create-outline" size={18} color="rgba(255,255,255,0.88)" />
            </Pressable>
          </View>

          {/* ── Identity ─────────────────────────────────────────────────── */}
          <View className="items-center">
            <StudentAvatar label={fullName} size={72} index={2} />

            <Text
              className="mt-4"
              style={{
                color: studentColors.white,
                fontFamily: 'Rubik',
                fontSize: 22,
                fontWeight: '600',
                lineHeight: 28,
                textAlign: 'center',
              }}
            >
              {fullName}
            </Text>

            {/* 2-column info grid */}
            <View className="flex-row gap-2 mt-3 w-full">
              {/* Email */}
              <Pressable
                onPress={() => copyToClipboard(String(email), 'Email')}
                hitSlop={4}
                className="flex-1 flex-row items-center gap-1.5 rounded-2xl px-3 py-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="mail-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text
                  numberOfLines={1}
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'Rubik',
                    fontSize: 12,
                    fontWeight: '400',
                    lineHeight: 16,
                    flex: 1,
                  }}
                >
                  {email}
                </Text>
                <Ionicons name="copy-outline" size={10} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Student ID */}
              <Pressable
                onPress={() => copyToClipboard(String(userIdLabel), 'Student ID')}
                hitSlop={4}
                className="flex-row items-center gap-1.5 rounded-2xl px-3 py-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="id-card-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'Rubik',
                    fontSize: 12,
                    fontWeight: '400',
                    lineHeight: 16,
                  }}
                >
                  {userIdLabel}
                </Text>
                <Ionicons name="copy-outline" size={10} color="rgba(255,255,255,0.35)" />
              </Pressable>
            </View>

            <View className="mt-3">
              <TrendBadge trend={localTrend} onPress={() => setShowTrendModal(true)} />
            </View>
          </View>
        </LinearGradient>





        {/* ── White Content Sheet ────────────────────────────────────────── */}
        <View className="bg-white rounded-t-[34px] -mt-7 px-6 pt-6 pb-7 min-h-[620px]">
          {loadError ? (
            <View
              className="rounded-[20px] border px-4 py-3 mb-4 bg-white"
              style={{ borderColor: '#F59E0B', ...studentShadow }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                <Text
                  style={{
                    color: studentColors.text,
                    fontFamily: 'Rubik',
                    fontSize: 14,
                    fontWeight: '600',
                    lineHeight: 20,
                  }}
                >
                  Some insight data is unavailable
                </Text>
              </View>
              <Text
                className="mt-1"
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 12,
                  fontWeight: '400',
                  lineHeight: 18,
                }}
              >
                {loadError}
              </Text>
            </View>
          ) : null}
          {/* ── Summary Stats ───────────────────────────────────────────── */}
          <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
            <View style={{ width: '48%' }}>
              <StatPill
                icon="document-text-outline"
                label="EXAMS TAKEN"
                value={`${summary?.total_exams ?? 0}`}
                onPress={() => openStatModal('Exams Taken', 'Total number of practice and qualifying exams you have completed.')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatPill
                icon="trending-up-outline"
                label="AVG SCORE"
                value={`${Math.round(summary?.average_score ?? 0)}%`}
                color={scoreMeta(summary?.average_score ?? 0).color}
                onPress={() => openStatModal('Average Score', 'Your average score across all completed exams.')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatPill
                icon="trophy-outline"
                label="BEST SCORE"
                value={`${Math.round(summary?.best_score ?? 0)}%`}
                color={studentColors.gold}
                onPress={() => openStatModal('Best Score', 'Your highest score achieved on any single exam.')}
              />
            </View>
            <View style={{ width: '48%' }}>
              <StatPill
                icon="reload-outline"
                label="TRIES TO PASS"
                value={`${summary?.average_attempts_before_passing ?? 0}`}
                onPress={() => openStatModal('Tries to Pass', 'Average number of attempts needed to first score ≥75% in a subject.')}
              />
            </View>
            {summary?.strongest_subject ? (
              <View style={{ width: '100%' }}>
                <StatPill
                  icon="star-outline"
                  label="TOP SUBJECT"
                  value={summary.strongest_subject}
                  color={studentColors.success}
                  onPress={() => openStatModal('Top Subject', 'The subject where you currently have the highest performance.')}
                />
              </View>
            ) : null}
          </View>

          {/* ── Recommendations (Hidden until UX is polished) ─────────── */}
          {/* TODO: Re-enable after improving recommendation text (topic names instead of IDs) */}
          {false && (
            <>
              {recommendationsError ? (
                <View
                  className="rounded-[20px] border-2 p-4 mt-1 mb-2 bg-white"
                  style={{ borderColor: studentColors.border, ...studentShadow }}
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="alert-circle-outline" size={20} color={studentColors.textSoft} />
                    <Text
                      style={{
                        color: studentColors.text,
                        fontFamily: 'Rubik',
                        fontSize: 16,
                        fontWeight: '600',
                        lineHeight: 22,
                      }}
                    >
                      Recommended For You
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: studentColors.textSoft,
                      fontFamily: 'Rubik',
                      fontSize: 13,
                      fontWeight: '400',
                      lineHeight: 20,
                    }}
                  >
                    Unable to load recommendations. Pull down to retry.
                  </Text>
                </View>
              ) : recommendations.length > 0 ? (
                <View
                  className="rounded-[20px] border-2 p-4 mt-1 mb-2 bg-white"
                  style={{ borderColor: studentColors.border, ...studentShadow }}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Ionicons name="bulb-outline" size={20} color={studentColors.orange} />
                    <Text
                      style={{
                        color: studentColors.text,
                        fontFamily: 'Rubik',
                        fontSize: 16,
                        fontWeight: '600',
                        lineHeight: 22,
                      }}
                    >
                      Recommended For You
                    </Text>
                  </View>
                  <View className="gap-2">
                    {recommendations.slice(0, 2).map((rec: any, i: number) => (
                      <View
                        key={i}
                        className="flex-row items-center gap-2.5 rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: studentColors.surfaceSoft }}
                      >
                        <Ionicons
                          name={i === 0 ? 'flame-outline' : 'book-outline'}
                          size={18}
                          color={studentColors.orange}
                        />
                        <Text
                          className="flex-1"
                          style={{
                            color: studentColors.text,
                            fontFamily: 'Rubik',
                            fontSize: 14,
                            fontWeight: '500',
                            lineHeight: 20,
                          }}
                        >
                          {rec.recommendation ?? rec.text ?? rec.message ?? JSON.stringify(rec)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}

          {/* ── Student Insight ──────────────────────────────────────────── */}
          <StudentSectionHeader
            title="Student Insight"
            style={{ marginTop: 22 }}
            actionLabel={insightViewMode === 'list' ? 'Card Form' : 'List Form'}
            onActionPress={() => setInsightViewMode(prev => prev === 'list' ? 'card' : 'list')}
          />
          <View className="gap-3 mt-[14px]">
            {insightViewMode === 'card' ? (
              <>
                <InsightCard
                  icon="time-outline"
                  label="Recent Performance"
                  description="View your latest exam results and trends"
                  color="#3B82F6"
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/(student)/practice-history',
                      params: { origin: 'profile' },
                    })
                  }
                />
                <InsightCard
                  icon="alert-circle-outline"
                  label="Frequent Mistakes"
                  description="Topics you often get wrong"
                  color="#EF4444"
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/(student)/frequently-mistaken',
                      params: { origin: 'profile' },
                    })
                  }
                />
                <InsightCard
                  icon="trending-up-outline"
                  label="Strong Areas"
                  description="Subjects where you excel"
                  color="#10B981"
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/(student)/strong-areas',
                      params: { origin: 'profile' },
                    })
                  }
                />
                <InsightCard
                  icon="fitness-outline"
                  label="Weak Areas"
                  description="Topics that need more practice"
                  color="#F59E0B"
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/(student)/weak-areas',
                      params: { origin: 'profile' },
                    })
                  }
                />
                <InsightCard
                  icon="hourglass-outline"
                  label="Time per Topic"
                  description="See how long you spend on each topic"
                  color="#8B5CF6"
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/(student)/time-per-topic',
                      params: { origin: 'profile' },
                    })
                  }
                />
              </>
            ) : (
              <View className="rounded-2xl overflow-hidden bg-white border border-[#EFEEFC]" style={studentShadow}>
                {[
                  { icon: "time-outline", label: "Recent Performance", color: "#3B82F6", path: '/(auth)/(student)/practice-history' },
                  { icon: "alert-circle-outline", label: "Frequent Mistakes", color: "#EF4444", path: '/(auth)/(student)/frequently-mistaken' },
                  { icon: "trending-up-outline", label: "Strong Areas", color: "#10B981", path: '/(auth)/(student)/strong-areas' },
                  { icon: "fitness-outline", label: "Weak Areas", color: "#F59E0B", path: '/(auth)/(student)/weak-areas' },
                  { icon: "hourglass-outline", label: "Time per Topic", color: "#8B5CF6", path: '/(auth)/(student)/time-per-topic' }
                ].map((item, idx, arr) => (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push({ pathname: item.path, params: { origin: 'profile' } })}
                    className={`flex-row items-center px-4 py-4 ${idx !== arr.length - 1 ? 'border-b border-[#EFEEFC]' : ''}`}
                    style={({ pressed }) => ({ backgroundColor: pressed ? '#F8F6FF' : '#FFFFFF' })}
                  >
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                    <Text className="flex-1 ml-3 text-[#0C092A] font-medium" style={{ fontFamily: 'Rubik', fontSize: 15 }}>
                      {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#858494" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Profile Menu Modal ───────────────────────────────────────────── */}
      <Modal visible={showProfileMenu} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-start pt-[60px]"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setShowProfileMenu(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="mx-4 rounded-2xl p-4"
              style={{ backgroundColor: studentColors.orange }}
            >
              <View className="flex-row items-center gap-3 mb-4 pb-4 border-b border-white/25">
                <View
                  className="w-12 h-12 rounded-full justify-center items-center"
                  style={{ backgroundColor: avatarColor, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  <Text className="text-lg font-extrabold text-white">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white">{fullName}</Text>
                  <Text className="text-[13px] text-white/80" numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <Pressable
                className="flex-row items-center gap-3 py-3"
                onPress={() => { setShowProfileMenu(false); setShowEditProfile(true); }}
              >
                <Ionicons name="person" size={20} color="#fff" />
                <Text className="text-[15px] font-medium text-white">Edit Profile</Text>
              </Pressable>

              <Pressable
                className="flex-row items-center gap-3 py-3"
                onPress={() => { setShowProfileMenu(false); router.push('/(auth)/(student)/bookmarks'); }}
              >
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text className="text-[15px] font-medium text-white">My Bookmarks</Text>
              </Pressable>

              <Pressable
                className="flex-row items-center gap-3 py-3"
                onPress={() => { setShowProfileMenu(false); toggleTheme(); }}
              >
                <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color="#fff" />
                <Text className="text-[15px] font-medium text-white">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </Pressable>

              <Pressable
                className="flex-row items-center gap-3 py-3 mt-2 pt-4 border-t border-white/25"
                onPress={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
              >
                <Ionicons name="log-out" size={20} color="#FFD7BC" />
                <Text className="text-[15px] font-medium text-[#FFD7BC]">Log Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          loadInsights({ silent: true });
        }}
        user={profile || user}
      />
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* ── Stat Explanation Modal ─────────────────────────────────────── */}
      <Modal visible={showStatModal} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setShowStatModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="rounded-[28px] p-6 w-full max-w-[340px]"
              style={{ backgroundColor: studentColors.white, ...studentShadow }}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${studentColors.orange}18` }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={studentColors.orange} />
                </View>
                <Text
                  className="flex-1"
                  style={{
                    color: studentColors.text,
                    fontFamily: 'Rubik',
                    fontSize: 17,
                    fontWeight: '600',
                    lineHeight: 24,
                  }}
                >
                  {statModalTitle}
                </Text>
              </View>
              <Text
                style={{
                  color: studentColors.textSoft,
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  fontWeight: '400',
                  lineHeight: 22,
                }}
              >
                {statModalDesc}
              </Text>
              <Pressable
                onPress={() => setShowStatModal(false)}
                className="mt-5 rounded-[14px] py-3 items-center"
                style={{ backgroundColor: studentColors.orange }}
              >
                <Text
                  style={{
                    color: studentColors.white,
                    fontFamily: 'Rubik',
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  Got it
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Trend Explanation Modal ─────────────────────────────────────── */}
      <Modal visible={showTrendModal} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setShowTrendModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="rounded-[28px] p-6 w-full max-w-[340px]"
              style={{ backgroundColor: studentColors.white, ...studentShadow }}
            >
              {/* Header */}
              <View className="flex-row items-center gap-3 mb-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${studentColors.orange}18` }}
                >
                  <Ionicons name="trending-up" size={20} color={studentColors.orange} />
                </View>
                <Text
                  style={{
                    color: studentColors.text,
                    fontFamily: 'Rubik',
                    fontSize: 17,
                    fontWeight: '600',
                    lineHeight: 24,
                  }}
                >
                  Performance Status
                </Text>
              </View>

              {/* Statuses */}
              {[
                {
                  icon: 'trending-up' as const,
                  color: studentColors.success,
                  label: 'Improving',
                  desc: 'Your recent exam scores are higher than your previous exam. Each score is compared to the one right before it.',
                },
                {
                  icon: 'remove' as const,
                  color: '#F59E0B',
                  label: 'Stable',
                  desc: 'Your scores are neither consistently higher nor lower than your previous exams — no clear upward or downward pattern.',
                },
                {
                  icon: 'trending-down' as const,
                  color: '#EF4444',
                  label: 'Declining',
                  desc: 'Your recent exam scores are lower than your previous exam. Review your weak topics and try more practice exams.',
                },
              ].map((item, idx, arr) => (
                <View
                  key={item.label}
                  className="flex-row gap-3 py-3"
                  style={{
                    borderBottomWidth: idx !== arr.length - 1 ? 1 : 0,
                    borderBottomColor: studentColors.border,
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
                    style={{ backgroundColor: `${item.color}18` }}
                  >
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        color: item.color,
                        fontFamily: 'Rubik',
                        fontSize: 14,
                        fontWeight: '700',
                        lineHeight: 20,
                      }}
                    >
                      {item.label}
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
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}

              <Pressable
                onPress={() => {
                  setShowTrendModal(false);
                  router.push({
                    pathname: '/(auth)/practice-exam/exam-trend-chart',
                    params: { data: JSON.stringify(trendData || []) },
                  });
                }}
                className="mt-3 rounded-[14px] py-3 items-center"
                style={{ backgroundColor: `${studentColors.orange}18`, borderWidth: 1, borderColor: studentColors.orange }}
              >
                <Text
                  style={{
                    color: studentColors.orange,
                    fontFamily: 'Rubik',
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  View Exam Trend Chart
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowTrendModal(false)}
                className="mt-3 rounded-[14px] py-3 items-center"
                style={{ backgroundColor: studentColors.orange }}
              >
                <Text
                  style={{
                    color: studentColors.white,
                    fontFamily: 'Rubik',
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  Got it
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
