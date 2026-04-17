import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { apiRequest } from '../../../src/services/apiClient';
import { getDashboardSummary, getFrequentlyMistakenQuestions, getLearningInsights, getPerformanceTrend } from '../../../src/services/studentAnalyticsService';
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

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
  const [frequentlyMistaken, setFrequentlyMistaken] = useState<any[]>([]);
  const [showAllFrequentlyMistaken, setShowAllFrequentlyMistaken] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Fetch all analytics data in parallel on mount ───────────────────────

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);

    try {
      const [profileResponse, summaryResponse, insightResponse, trendResponse, frequentlyMistakenResponse] = await Promise.all([
        apiRequest('/api/user/profile').catch(() => ({ data: user })),
        getDashboardSummary(),
        getLearningInsights(),
        getPerformanceTrend(),
        getFrequentlyMistakenQuestions(),
      ]);

      setProfile(profileResponse?.data || profileResponse || user);
      setSummary(summaryResponse?.data || summaryResponse || {});
      setInsights(insightResponse?.data || insightResponse || {});
      setRecentPerformance(trendResponse?.data || []);
      const mistakenItems = Array.isArray(frequentlyMistakenResponse?.data) ? frequentlyMistakenResponse.data : [];
      setFrequentlyMistaken(
        mistakenItems
          .filter((item: any) => Number(item?.consecutive_wrong_count ?? item?.wrong_count ?? 0) >= 3)
          .sort(
            (a: any, b: any) =>
              Number(b?.consecutive_wrong_count ?? b?.wrong_count ?? 0) -
              Number(a?.consecutive_wrong_count ?? a?.wrong_count ?? 0)
          )
      );
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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* ─────────────────────────────────────────────────────────────────
          SCROLLABLE CONTENT
          Orange hero header with student avatar + white sheet with
          stats, recent performance, weak areas, and time-per-topic.
          ───────────────────────────────────────────────────────────────── */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ───────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Student avatar (centered) with stats chart icon badge.
            ─────────────────────────────────────────────────────────────── */}
        <View className="px-6 pb-[42px]" style={{ paddingTop: insets.top + 12, backgroundColor: studentColors.orange }}>
          <StudentHeroDecoration />

          <View className="flex-row items-center justify-between mb-[30px]">
            <Text
              className="text-white"
              style={{
                fontFamily: 'Rubik',
                fontSize: 28,
                fontWeight: '500',
                lineHeight: 36,
              }}
            >
              Insights
            </Text>
            <View
              className="w-[42px] h-[42px] rounded-[21px] items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <Ionicons name="stats-chart-outline" size={18} color={studentColors.white} />
            </View>
          </View>

          <View className="items-center">
            <StudentAvatar
              label={fullName}
              size={84}
              index={2}
              style={{ borderWidth: 4, borderColor: 'rgba(255,255,255,0.72)' }}
            />
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
        <View
          className="bg-white rounded-t-[34px] -mt-7 px-6 pt-6 pb-7 min-h-[620px]"
        >
          <Text
            className="text-center"
            style={{
              color: studentColors.text,
              fontFamily: 'Rubik',
              fontSize: 30,
              fontWeight: '500',
              lineHeight: 38,
            }}
          >
            {fullName}
          </Text>

          {/* ── Stats card: orange card with average attempts + strongest subject ── */}
          <View
            className="rounded-3xl p-[14px] gap-2.5 mt-[18px]"
            style={{ backgroundColor: studentColors.orange, ...studentShadow }}
          >
            <View className="rounded-[18px] px-[14px] py-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.84)',
                  fontFamily: 'Rubik',
                  fontSize: 10,
                  fontWeight: '500',
                  lineHeight: 16,
                  letterSpacing: 1.6,
                }}
              >
                AVERAGE ATTEMPTS
              </Text>
              <Text
                className="mt-1.5"
                style={{
                  color: studentColors.white,
                  fontFamily: 'Rubik',
                  fontSize: 26,
                  fontWeight: '500',
                  lineHeight: 34,
                }}
              >
                {avgAttempts}
              </Text>
            </View>

            <View className="rounded-[18px] px-[14px] py-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.84)',
                  fontFamily: 'Rubik',
                  fontSize: 10,
                  fontWeight: '500',
                  lineHeight: 16,
                  letterSpacing: 1.6,
                }}
              >
                STRONGEST SUBJECT
              </Text>
              <Text
                numberOfLines={2}
                className="mt-1.5"
                style={{
                  color: studentColors.white,
                  fontFamily: 'Rubik',
                  fontSize: 19,
                  fontWeight: '500',
                  lineHeight: 26,
                }}
              >
                {strongestSubject}
              </Text>
            </View>
          </View>

          {/* ── Recent Performance: tap to view full exam result details ── */}
          <View
            className="rounded-[20px] border-2 p-4 mt-1 mb-2 bg-white"
            style={{ borderColor: studentColors.border, ...studentShadow }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="trending-up-outline" size={20} color={studentColors.orange} />
              <Text
                style={{
                  color: studentColors.text,
                  fontFamily: 'Rubik',
                  fontSize: 16,
                  fontWeight: '600',
                  lineHeight: 22,
                }}
              >
                Recent
              </Text>
            </View>
            <View className="gap-2.5">
              {recentPerformance.length === 0 ? (
                <Text
                  className="text-center py-3"
                  style={{
                    color: studentColors.textSoft,
                    fontFamily: 'Rubik',
                    fontSize: 14,
                    fontWeight: '400',
                    lineHeight: 20,
                  }}
                >
                  No recent exams
                </Text>
              ) : (
                <>
                  {(showAllRecent ? recentPerformance : recentPerformance.slice(0, 5)).map((entry: any, index: number) => {
                    const score = entry?.score_percentage ?? 0;
                    return (
                      <Pressable
                        key={`${entry.result_id}-${index}`}
                        className="flex-row items-center justify-between py-2 px-3 rounded-xl"
                        style={{ backgroundColor: studentColors.surfaceSoft }}
                        onPress={() => {
                          if (entry?.result_id) {
                            router.push({
                              pathname: '/(auth)/practice-exam/results',
                              params: { resultId: entry.result_id },
                            });
                          }
                        }}
                      >
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
                          {entry?.label || 'Unknown'}
                        </Text>
                        <Text
                          style={{
                            color: score >= 70 ? studentColors.success : score >= 50 ? '#856404' : '#D32F2F',
                            fontFamily: 'Rubik',
                            fontSize: 14,
                            fontWeight: '700',
                            lineHeight: 20,
                          }}
                        >
                          {Math.round(score)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                  {recentPerformance.length > 5 ? (
                    <Pressable
                      className="flex-row items-center justify-center gap-1.5 py-3 mt-2"
                      style={{ borderTopWidth: 1, borderTopColor: studentColors.border }}
                      onPress={() => setShowAllRecent(!showAllRecent)}
                    >
                      <Text
                        style={{
                          color: studentColors.orange,
                          fontFamily: 'Rubik',
                          fontSize: 14,
                          fontWeight: '600',
                          lineHeight: 20,
                        }}
                      >
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

          {/* ── Frequently Mistaken: top 5 review questions with View All toggle ── */}
          <View
            className="rounded-[20px] border-2 p-4 mt-1 mb-2 bg-white"
            style={{ borderColor: studentColors.border, ...studentShadow }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="alert-circle-outline" size={20} color={studentColors.orange} />
              <Text
                style={{
                  color: studentColors.text,
                  fontFamily: 'Rubik',
                  fontSize: 16,
                  fontWeight: '600',
                  lineHeight: 22,
                }}
              >
                Frequently Mistaken
              </Text>
            </View>
            <View className="gap-2.5">
              {frequentlyMistaken.length === 0 ? (
                <View className="items-center gap-2 py-4">
                  <Ionicons name="checkmark-circle-outline" size={28} color={studentColors.success} />
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
                    No frequently mistaken questions to review right now.
                  </Text>
                </View>
              ) : (
                <>
                  {(showAllFrequentlyMistaken ? frequentlyMistaken : frequentlyMistaken.slice(0, 5)).map((item: any, index: number) => (
                    <View
                      key={`${item.questionID}-${index}`}
                      className="flex-row items-center justify-between py-2 px-3 rounded-xl"
                      style={{ backgroundColor: studentColors.surfaceSoft }}
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          numberOfLines={1}
                          style={{
                            color: studentColors.text,
                            fontFamily: 'Rubik',
                            fontSize: 14,
                            fontWeight: '600',
                            lineHeight: 20,
                          }}
                        >
                          {item.subjectName || 'Unknown Subject'}
                        </Text>
                        <Text
                          numberOfLines={2}
                          className="mt-0.5"
                          style={{
                            color: studentColors.textSoft,
                            fontFamily: 'Rubik',
                            fontSize: 11,
                            fontWeight: '400',
                            lineHeight: 18,
                          }}
                        >
                          {stripHtml(item.questionText || 'Question unavailable')}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <View
                            className="min-w-[28px] h-[18px] rounded-full items-center justify-center px-1.5"
                            style={{ backgroundColor: '#FEE2E2' }}
                          >
                            <Text
                              style={{
                                color: '#EF4444',
                                fontFamily: 'Rubik',
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              {item.consecutive_wrong_count > 0 ? item.consecutive_wrong_count : item.wrong_count}x
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: studentColors.textSoft,
                              fontFamily: 'Rubik',
                              fontSize: 10,
                              fontWeight: '400',
                              lineHeight: 18,
                            }}
                          >
                            mistakes
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="bookmark" size={16} color="#F59E0B" />
                    </View>
                  ))}
                  {frequentlyMistaken.length > 5 ? (
                    <Pressable
                      className="flex-row items-center justify-center gap-1.5 py-3 mt-2"
                      style={{ borderTopWidth: 1, borderTopColor: studentColors.border }}
                      onPress={() => setShowAllFrequentlyMistaken(!showAllFrequentlyMistaken)}
                    >
                      <Text
                        style={{
                          color: studentColors.orange,
                          fontFamily: 'Rubik',
                          fontSize: 14,
                          fontWeight: '600',
                          lineHeight: 20,
                        }}
                      >
                        {showAllFrequentlyMistaken ? 'Show Less' : 'View All'}
                      </Text>
                      <Ionicons
                        name={showAllFrequentlyMistaken ? 'chevron-up-outline' : 'chevron-down-outline'}
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
          <View className="gap-3 mt-[14px]">
            {weakTopics.length === 0 ? (
              <View
                className="items-center justify-center gap-2.5 rounded-3xl border-2 py-7 px-5 bg-white"
                style={{ borderColor: studentColors.border, ...studentShadow }}
              >
                <Ionicons name="checkmark-circle-outline" size={30} color={studentColors.orange} />
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
                  No weak areas detected yet.
                </Text>
              </View>
            ) : (
              weakTopics.map((topic: any, index: number) => (
                <View
                  key={`${topic.topic}-${index}`}
                  className="flex-row items-center gap-3.5 rounded-[22px] border-2 px-3 py-2.5 bg-white"
                  style={{ borderColor: studentColors.border, ...studentShadow }}
                >
                  <View
                    className="w-14 h-14 rounded-[18px] items-center justify-center"
                    style={{ backgroundColor: studentColors.surfaceSoft }}
                  >
                    <Ionicons name={index % 2 === 0 ? 'calculator-outline' : 'book-outline'} size={22} color={studentColors.orange} />
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
                      {topic.topic}
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
                      {Math.round((topic.error_rate ?? 0) * 100)}% Error rate
                    </Text>
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
            style={{ marginTop: 22 }}
          />

          <View className="gap-3 mt-[14px]">
            {timeSpent.length === 0 ? (
              <View
                className="items-center justify-center gap-2.5 rounded-3xl border-2 py-7 px-5 bg-white"
                style={{ borderColor: studentColors.border, ...studentShadow }}
              >
                <Ionicons name="time-outline" size={30} color={studentColors.orange} />
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
                  No time data available yet.
                </Text>
              </View>
            ) : (
              <>
                {timeSpent.map((entry: any, index: number) => {
                  const width = Math.min(100, Math.max(12, ((entry?.minutes ?? 0) / 60) * 100));

                  return (
                    <View
                      key={`${entry.topic}-${index}`}
                      className="rounded-[22px] border-2 px-3 py-3 bg-white"
                      style={{ borderColor: studentColors.border, ...studentShadow }}
                    >
                      <View className="flex-row items-center gap-3.5 mb-3">
                        <View
                          className="w-14 h-14 rounded-[18px] items-center justify-center"
                          style={{ backgroundColor: studentColors.surfaceSoft }}
                        >
                          <Ionicons
                            name={index % 2 === 0 ? 'bar-chart-outline' : 'timer-outline'}
                            size={22}
                            color={studentColors.orange}
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
                            {entry?.topic || 'Unknown Topic'}
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
                            {entry?.minutes ?? 0} minutes
                          </Text>
                        </View>
                      </View>

                      <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: studentColors.surfaceSoft }}>
                        <View className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: studentColors.orange }} />
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
