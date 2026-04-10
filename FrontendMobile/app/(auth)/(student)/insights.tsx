import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { getDashboardSummary, getLearningInsights, getPerformanceTrend } from '../../../src/services/studentAnalyticsService';
import {
  StudentAvatar,
  StudentHeroDecoration,
  StudentSectionHeader,
  studentColors,
  studentShadow,
} from '../../../src/student/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Builds display name from profile or fallback user object.
// Tries fullName first, then firstName+lastName, then falls back to 'Student'.
// ─────────────────────────────────────────────────────────────────────────────
const buildDisplayName = (profile: any, fallbackUser: any) =>
  profile?.fullName ||
  [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
  fallbackUser?.fullName ||
  [fallbackUser?.firstName, fallbackUser?.lastName].filter(Boolean).join(' ') ||
  fallbackUser?.name ||
  'Student';

export default function StudentInsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;

  // ── Data state ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<any>(user);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [recentPerformance, setRecentPerformance] = useState<any[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Fetch all analytics data in parallel on mount ───────────────────────

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);

    try {
      const [profileResponse, summaryResponse, insightResponse, trendResponse] = await Promise.all([
        apiRequest('/api/user/profile').catch(() => ({ data: user })),
        getDashboardSummary(),
        getLearningInsights(),
        getPerformanceTrend(),
      ]);

      setProfile(profileResponse?.data || profileResponse || user);
      setSummary(summaryResponse?.data || summaryResponse || {});
      setInsights(insightResponse?.data || insightResponse || {});
      setRecentPerformance(trendResponse?.data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived values: display name, average attempts, strongest subject ───
  const fullName = buildDisplayName(profile, user);
  const avgAttempts = insights?.average_attempts_before_passing ?? summary?.average_attempts_before_passing ?? '--';
  const strongestSubject = insights?.strongest_subject ?? summary?.strongest_subject ?? 'N/A';

  // ── Weak topics: prefers insights API, falls back to summary's weakest topic ──
  const weakTopics = useMemo(() => {
    if (Array.isArray(insights?.weak_topics) && insights.weak_topics.length > 0) {
      return insights.weak_topics;
    }

    if (summary?.weakest_topic?.name && summary.weakest_topic.name !== 'N/A') {
      return [
        {
          topic: summary.weakest_topic.name,
          error_rate: summary.weakest_topic.error_rate ?? 0,
        },
      ];
    }

    return [];
  }, [insights?.weak_topics, summary?.weakest_topic]);

  const timeSpent = Array.isArray(insights?.time_spent_per_topic) ? insights.time_spent_per_topic : [];

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ─────────────────────────────────────────────────────────────────
          SCROLLABLE CONTENT
          Orange hero header with student avatar + white sheet with
          stats, recent performance, weak areas, and time-per-topic.
          ───────────────────────────────────────────────────────────────── */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ───────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Student avatar (centered) with stats chart icon badge.
            ─────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <StudentHeroDecoration />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Insights</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="stats-chart-outline" size={18} color={studentColors.white} />
            </View>
          </View>

          <View style={styles.avatarWrap}>
            <StudentAvatar label={fullName} size={84} index={2} style={styles.profileAvatar} />
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────
            WHITE CONTENT SHEET
            Contains 4 sections:
              1. Student name + stats card (avg attempts, strongest subject)
              2. Recent Performance box (tap to view exam results)
              3. Weak Areas list (topics with highest error rates)
              4. Time per Topic (bar chart showing minutes per topic)
            ─────────────────────────────────────────────────────────────── */}
        <View style={styles.sheet}>
          <Text style={styles.profileName}>{fullName}</Text>

          {/* ── Stats card: orange card with average attempts + strongest subject ── */}
          <View style={styles.statsCard}>
            <View style={styles.statPane}>
              <Text style={styles.statLabel}>AVERAGE ATTEMPTS</Text>
              <Text style={styles.statValue}>{avgAttempts}</Text>
            </View>

            <View style={styles.statPane}>
              <Text style={styles.statLabel}>STRONGEST SUBJECT</Text>
              <Text numberOfLines={2} style={styles.statValueSmall}>
                {strongestSubject}
              </Text>
            </View>
          </View>

          {/* ── Recent Performance: tap to view full exam result details ── */}
          <View style={styles.recentPerformanceBox}>
            <View style={styles.recentPerformanceHeader}>
              <Ionicons name="trending-up-outline" size={20} color={studentColors.orange} />
              <Text style={styles.recentPerformanceTitle}>Recent</Text>
            </View>
            <View style={styles.recentPerformanceList}>
              {recentPerformance.length === 0 ? (
                <Text style={styles.recentPerformanceEmpty}>No recent exams</Text>
              ) : (
                <>
                  {(showAllRecent ? recentPerformance : recentPerformance.slice(0, 5)).map((entry: any, index: number) => {
                    const score = entry?.score_percentage ?? 0;
                    return (
                      <Pressable
                        key={`${entry.result_id}-${index}`}
                        style={styles.recentPerformanceItem}
                        onPress={() => {
                          if (entry?.result_id) {
                            router.push({
                              pathname: '/(auth)/practice-exam/results',
                              params: { resultId: entry.result_id },
                            });
                          }
                        }}
                      >
                        <Text numberOfLines={1} style={styles.recentPerformanceSubject}>
                          {entry?.label || 'Unknown'}
                        </Text>
                        <Text style={[styles.recentPerformanceScore, { color: score >= 70 ? studentColors.success : score >= 50 ? '#856404' : '#D32F2F' }]}>
                          {Math.round(score)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                  {recentPerformance.length > 5 ? (
                    <Pressable
                      style={styles.viewAllButton}
                      onPress={() => setShowAllRecent(!showAllRecent)}
                    >
                      <Text style={styles.viewAllButtonText}>
                        {showAllRecent ? 'Show Less' : 'View All'}
                      </Text>
                      <Ionicons
                        name={showAllRecent ? 'chevron-up-outline' : 'chevron-down-outline'}
                        size={16}
                        color={studentColors.orange}
                      />
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {/* ── Weak Areas: topics with highest error rates from analytics ── */}
          <StudentSectionHeader title="Weak Areas" actionLabel="List Form" actionColor={studentColors.textSoft} />
          <View style={styles.sectionList}>
            {weakTopics.length === 0 ? (
              <View style={styles.feedbackCard}>
                <Ionicons name="checkmark-circle-outline" size={30} color={studentColors.orange} />
                <Text style={styles.feedbackText}>No weak areas detected yet.</Text>
              </View>
            ) : (
              weakTopics.map((topic: any, index: number) => (
                <View key={`${topic.topic}-${index}`} style={styles.detailCard}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={index % 2 === 0 ? 'calculator-outline' : 'book-outline'} size={22} color={studentColors.orange} />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text numberOfLines={2} style={styles.detailTitle}>
                      {topic.topic}
                    </Text>
                    <Text style={styles.detailMeta}>{Math.round((topic.error_rate ?? 0) * 100)}% Error rate</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── Time per Topic: horizontal bar chart showing study minutes ── */}
          <StudentSectionHeader
            title="Time per Topic"
            actionLabel="List Form"
            actionColor={studentColors.textSoft}
            style={styles.timeHeader}
          />

          <View style={styles.sectionList}>
            {timeSpent.length === 0 ? (
              <View style={styles.feedbackCard}>
                <Ionicons name="time-outline" size={30} color={studentColors.orange} />
                <Text style={styles.feedbackText}>No time data available yet.</Text>
              </View>
            ) : (
              <>
              {timeSpent.map((entry: any, index: number) => {
                const width = Math.min(100, Math.max(12, ((entry?.minutes ?? 0) / 60) * 100));

                return (
                  <View key={`${entry.topic}-${index}`} style={styles.timeCard}>
                    <View style={styles.timeCardTop}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons
                          name={index % 2 === 0 ? 'bar-chart-outline' : 'timer-outline'}
                          size={22}
                          color={studentColors.orange}
                        />
                      </View>

                      <View style={styles.detailCopy}>
                        <Text numberOfLines={2} style={styles.detailTitle}>
                          {entry?.topic || 'Unknown Topic'}
                        </Text>
                        <Text style={styles.detailMeta}>{entry?.minutes ?? 0} minutes</Text>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${width}%` }]} />
                    </View>
                  </View>
                );
              })}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.white,
  },
  content: {
    paddingBottom: 120,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: studentColors.surface,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 42,
    backgroundColor: studentColors.orange,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  heroTitle: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 36,
  },
  heroBadge: {
    // Stats chart icon badge in top-right of hero header
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  sheet: {
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    minHeight: 620,
  },
  profileName: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 38,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 24,
    backgroundColor: studentColors.orange,
    padding: 14,
    gap: 10,
    marginTop: 18,
    ...studentShadow,
  },
  statPane: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.84)',
    fontFamily: 'Rubik',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 1.6,
  },
  statValue: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 34,
    marginTop: 6,
  },
  statValueSmall: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 19,
    fontWeight: '500',
    lineHeight: 26,
    marginTop: 6,
  },
  sectionList: {
    gap: 12,
    marginTop: 14,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...studentShadow,
  },
  detailIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: studentColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
  },
  detailTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  detailMeta: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 4,
  },
  timeHeader: {
    marginTop: 22,
  },
  timeCard: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...studentShadow,
  },
  timeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: studentColors.surfaceSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: studentColors.orange,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
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
  performanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...studentShadow,
  },
  performanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  performanceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceCopy: {
    flex: 1,
  },
  performanceTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  performanceDate: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  performanceScore: {
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  recentPerformanceBox: {
    borderRadius: 20,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
    ...studentShadow,
  },
  recentPerformanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recentPerformanceTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  recentPerformanceList: {
    gap: 10,
  },
  recentPerformanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: studentColors.surfaceSoft,
    borderRadius: 12,
  },
  recentPerformanceSubject: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  recentPerformanceScore: {
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  recentPerformanceEmpty: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: studentColors.border,
  },
  viewAllButtonText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
