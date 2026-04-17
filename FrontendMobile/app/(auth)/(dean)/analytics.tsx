// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin Analytics screen — fetches all platform analytics endpoints
//          and displays them in metric cards, charts, and progress bars.
// Key sections: Summary metrics, subject scores, topic mastery, content analytics
//               with progress visualization.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../../src/contexts/ThemeContext';
import {
  getAllAnalytics,
  type DashboardSummary,
  type SubjectScore,
  type TopicMastery,
  type ContentAnalytics,
  type ProgressPoint,
  type PassFailRate,
  type ImprovementData,
} from '../../../src/services/adminAnalyticsService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Analytics data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [content, setContent] = useState<ContentAnalytics | null>(null);
  const [passFailRate, setPassFailRate] = useState<PassFailRate>({ pass_rate: 0, fail_rate: 0, total_passed: 0, total_failed: 0 });
  const [improvement, setImprovement] = useState<ImprovementData>({ improvement_percentage: 0, previous_period_avg: 0, current_period_avg: 0 });
  const [progress, setProgress] = useState<ProgressPoint[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllAnalytics();
      setSummary(data.summary);
      setSubjectScores(data.subjectScores);
      setTopicMastery(data.topicMastery);
      setContent(data.content);
      setPassFailRate(data.passFail);
      setImprovement(data.improvement);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics. Pull down to retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    orange: '#FE6902',
    green: '#10B981',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    red: '#EF4444',
    yellow: '#F59E0B',
  };

  // Summary metrics (top row)
  const summaryMetrics = [
    { label: 'Avg Score', value: `${Math.round(summary?.average_score || 0)}%`, icon: 'analytics' as const, color: colors.orange },
    { label: 'Active Students', value: summary?.active_students?.toString() || '0', icon: 'people' as const, color: colors.purple },
    { label: 'Total Exams', value: summary?.total_exams?.toString() || '0', icon: 'clipboard' as const, color: colors.blue },
    { label: 'Best Score', value: `${Math.round(summary?.best_score || 0)}%`, icon: 'trophy' as const, color: colors.yellow },
  ];

  // Pass/Fail metrics
  const passFailMetrics = [
    { label: 'Pass Rate', value: `${Math.round(passFailRate.pass_rate)}%`, icon: 'checkmark-circle' as const, color: colors.green },
    { label: 'Improvement', value: `+${Math.round(improvement.improvement_percentage)}%`, icon: 'trending-up' as const, color: colors.blue },
  ];

  // Content metrics
  const contentMetrics = content ? [
    { label: 'Questions', value: content.total_questions, icon: 'help-circle' as const, color: colors.orange },
    { label: 'Approved', value: content.approved_questions, icon: 'checkmark-done' as const, color: colors.green },
    { label: 'Subjects', value: content.total_subjects, icon: 'book' as const, color: colors.blue },
    { label: 'Topics', value: content.total_topics, icon: 'layers' as const, color: colors.purple },
  ] : [];

  const renderProgressBar = (value: number, color: string, height: number = 8) => {
    const percentage = Math.min(100, Math.max(0, value));
    return (
      <View style={[styles.progressTrack, { height, backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color, height }]} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.red} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} />
          }
        >
          {/* Summary Stats Grid */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
          <View style={styles.metricsGrid}>
            {summaryMetrics.map((metric, idx) => (
              <View key={idx} style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Ionicons name={metric.icon} size={24} color={metric.color} />
                <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
              </View>
            ))}
          </View>

          {/* Pass/Fail & Improvement */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance</Text>
          <View style={styles.metricsRow}>
            {passFailMetrics.map((metric, idx) => (
              <View key={idx} style={[styles.wideCard, { backgroundColor: colors.card }]}>
                <View style={styles.wideCardHeader}>
                  <Ionicons name={metric.icon} size={24} color={metric.color} />
                  <Text style={[styles.wideCardLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
                </View>
                <Text style={[styles.wideCardValue, { color: colors.text }]}>{metric.value}</Text>
              </View>
            ))}
          </View>

          {/* Pass/Fail Pie Chart */}
          {(passFailRate.total_passed > 0 || passFailRate.total_failed > 0) && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pass / Fail Distribution</Text>
              <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
                <PieChart
                  data={[
                    { name: 'Passed', population: passFailRate.total_passed || 1, color: colors.green, legendFontColor: colors.text, legendFontSize: 12 },
                    { name: 'Failed', population: passFailRate.total_failed || 0, color: colors.red, legendFontColor: colors.text, legendFontSize: 12 },
                  ]}
                  width={width - 64}
                  height={180}
                  chartConfig={{
                    color: () => colors.text,
                    labelColor: () => colors.text,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="16"
                  absolute
                />
              </View>
            </>
          )}

          {/* Progress Over Time Line Chart */}
          {progress.length > 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Score Trend (30 Days)</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <LineChart
                  data={{
                    labels: progress.map((p, i) => (i % Math.ceil(progress.length / 5) === 0 ? p.date.slice(5) : '')),
                    datasets: [{ data: progress.map((p) => p.score) }],
                  }}
                  width={width - 64}
                  height={200}
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: () => colors.orange,
                    labelColor: () => colors.textSecondary,
                    style: { borderRadius: 12 },
                    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.orange },
                  }}
                  bezier
                  style={{ borderRadius: 12 }}
                  withInnerLines={false}
                />
              </View>
            </>
          )}

          {/* Subject Scores Bar Chart */}
          {subjectScores.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject Performance</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <BarChart
                  data={{
                    labels: subjectScores.slice(0, 6).map((s) => s.subject_name.slice(0, 8)),
                    datasets: [{ data: subjectScores.slice(0, 6).map((s) => Math.round(s.average_score)) }],
                  }}
                  width={width - 64}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: () => colors.orange,
                    labelColor: () => colors.textSecondary,
                    style: { borderRadius: 12 },
                  }}
                  style={{ borderRadius: 12, marginLeft: -8 }}
                  showValuesOnTopOfBars
                  withInnerLines={false}
                />
              </View>
            </>
          )}

          {/* Topic Mastery Bar Chart */}
          {topicMastery.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Topic Mastery</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <BarChart
                  data={{
                    labels: topicMastery.slice(0, 6).map((t) => t.topic_name.slice(0, 8)),
                    datasets: [{ data: topicMastery.slice(0, 6).map((t) => Math.round(t.mastery_level * 100)) }],
                  }}
                  width={width - 64}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: () => colors.blue,
                    labelColor: () => colors.textSecondary,
                    style: { borderRadius: 12 },
                  }}
                  style={{ borderRadius: 12, marginLeft: -8 }}
                  showValuesOnTopOfBars
                  withInnerLines={false}
                />
              </View>
            </>
          )}

          {/* Content Analytics */}
          {content && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Content Overview</Text>
              <View style={styles.metricsGrid}>
                {contentMetrics.map((metric, idx) => (
                  <View key={idx} style={[styles.metricCard, { backgroundColor: colors.card }]}>
                    <Ionicons name={metric.icon} size={24} color={metric.color} />
                    <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Weakest Topic (if available) */}
          {summary?.weakest_topic && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Areas for Improvement</Text>
              <View style={[styles.warningCard, { backgroundColor: colors.card, borderLeftColor: colors.yellow }]}>
                <Ionicons name="warning" size={24} color={colors.yellow} />
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: colors.text }]}>{summary.weakest_topic.name}</Text>
                  <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                    Error rate: {Math.round((summary.weakest_topic.error_rate || 0) * 100)}%
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = {
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wideCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  wideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wideCardLabel: {
    fontSize: 13,
  },
  wideCardValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  subjectRow: {
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subjectScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicRow: {
    marginBottom: 12,
  },
  topicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  topicPercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    marginTop: 2,
  },
};
