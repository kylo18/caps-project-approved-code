// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin Analytics screen — fetches aggregate platform analytics
//          (average score, pass rate, improvement percentage, active students)
//          and displays them in a grid of metric cards.
// Key sections: Header with back button, metrics grid (4 cards), informational
//               card noting that detailed charts are forthcoming, loading state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ avgScore: 0, passRate: 0, improvement: 0, activeStudents: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [summary, passFail, improvement] = await Promise.all([
        apiRequest('/api/admin/analytics/summary'),
        apiRequest('/api/admin/analytics/pass-fail-rate'),
        apiRequest('/api/admin/analytics/improvement-percentage'),
      ]);
      
      setStats({
        avgScore: summary?.data?.average_score ?? 0,
        passRate: passFail?.data?.pass_rate ?? passFail?.data?.passRate ?? 0,
        improvement: improvement?.data?.improvement_percentage ?? improvement?.data?.improvementPercentage ?? 0,
        activeStudents: summary?.data?.active_students ?? summary?.data?.activeStudents ?? 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    orange: '#FE6902',
    green: '#10B981',
    blue: '#3B82F6',
    purple: '#8B5CF6',
  };

  const metrics = [
    { label: 'Average Score', value: `${stats.avgScore}%`, icon: 'analytics', color: colors.orange },
    { label: 'Pass Rate', value: `${stats.passRate}%`, icon: 'checkmark-circle', color: colors.green },
    { label: 'Improvement', value: `+${stats.improvement}%`, icon: 'trending-up', color: colors.blue },
    { label: 'Active Students', value: stats.activeStudents.toString(), icon: 'people', color: colors.purple },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, idx) => (
              <View key={idx} style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Ionicons name={metric.icon} size={28} color={metric.color} />
                <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={24} color={colors.orange} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Detailed Analytics</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              More detailed charts and breakdown will be available soon, including per-subject analysis, topic mastery, and student progress over time.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 100, gap: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { width: '48%', borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
  metricValue: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  metricLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  infoCard: { borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  infoTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  infoText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
