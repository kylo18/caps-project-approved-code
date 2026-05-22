import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getStudentColors, getStudentShadow } from '../../../src/features/student/ui/StudentUI';

type ExamEntry = {
  label: string;
  score_percentage: number;
  taken_at?: string | null;
  subject_id?: number | null;
  result_id?: string | null;
  attempt_id?: string | null;
};

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExamTrendChartScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const themeColors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; origin?: string }>();
  const data = params.data;
  const origin = params.origin || 'profile';

  const allData: ExamEntry[] = useMemo(() => {
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [data]);

  // Sort chronologically (oldest first for the chart)
  const sortedData = useMemo(
    () =>
      [...allData].sort((a, b) =>
        (a.taken_at || '').localeCompare(b.taken_at || '')
      ),
    [allData]
  );

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Unique subjects from data
  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    allData.forEach((e) => {
      if (e.label) map.set(e.label, e.label);
    });
    return Array.from(map.values());
  }, [allData]);

  const filtered = useMemo(() => {
    return selectedSubject
      ? sortedData.filter((e) => e.label === selectedSubject)
      : sortedData;
  }, [sortedData, selectedSubject]);

  // Chart data: show last 15 exams max to avoid crowding
  const chartData = filtered.slice(-15);

  const screenWidth = Dimensions.get('window').width - 48;
  const chartHeight = 220;

  const hasEnoughData = chartData.length >= 2;
  const uniqueSubjects = subjects.length > 1;

  const colors = {
    bg: themeColors.page,
    card: themeColors.card,
    text: themeColors.text,
    textSecondary: themeColors.textSoft,
    border: themeColors.border,
    orange: themeColors.orange,
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-3 border-b"
        style={{
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 mr-2"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Exam Trend Chart
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Subject filter chips */}
        {uniqueSubjects && (
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
              Filter by Subject
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedSubject(null)}
                className="px-4 py-1.5 rounded-full border text-sm font-medium"
                style={{
                  backgroundColor: selectedSubject === null ? colors.orange : 'transparent',
                  borderColor: selectedSubject === null ? 'transparent' : colors.border,
                }}
              >
                <Text style={{ color: selectedSubject === null ? '#fff' : colors.text }}>All</Text>
              </TouchableOpacity>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSubject(s === selectedSubject ? null : s)}
                  className="px-4 py-1.5 rounded-full border text-sm font-medium"
                  style={{
                    backgroundColor: selectedSubject === s ? colors.orange : 'transparent',
                    borderColor: selectedSubject === s ? 'transparent' : colors.border,
                  }}
                >
                  <Text style={{ color: selectedSubject === s ? '#fff' : colors.text }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Chart or empty state */}
        {hasEnoughData ? (
          <View
            className="rounded-3xl p-4 border"
            style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
          >
            <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
              Score Trend
            </Text>
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {selectedSubject ? selectedSubject : 'All Exams'}
              {' — '}{chartData.length} exam{chartData.length !== 1 ? 's' : ''}
            </Text>

            <LineChart
              data={{
                labels: chartData.map((e) => formatDate(e.taken_at || '')),
                datasets: [
                  {
                    data: chartData.map((e) => e.score_percentage),
                    color: () => colors.orange,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 32}
              height={chartHeight}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: () => colors.orange,
                labelColor: () => colors.textSecondary,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.orange,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '4 4',
                  stroke: isDark ? '#374151' : '#e5e7eb',
                },
              }}
              bezier
              style={{ marginLeft: -16, borderRadius: 16 }}
              withHorizontalLabels
              withVerticalLabels
              withDots
              withInnerLines
              withOuterLines={false}
              fromZero
              yAxisSuffix=""
            />

            {/* Pass threshold note */}
            <View className="flex-row items-center mt-3">
              <View className="w-3 h-px flex-1" style={{ backgroundColor: themeColors.success }} />
              <Text className="text-xs px-2" style={{ color: colors.textSecondary }}>
                75% = passing threshold
              </Text>
            </View>
          </View>
        ) : (
          <View
            className="rounded-3xl p-8 items-center border"
            style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}
          >
            <Ionicons name="stats-chart-outline" size={56} color={colors.textSecondary} />
            <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>
              No Data Yet
            </Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
              {allData.length === 0
                ? 'Take your first practice exam to see your score trend here.'
                : 'At least 2 exams are needed to display a trend chart.'}
            </Text>
          </View>
        )}

        {/* Exam list below chart */}
        {hasEnoughData && (
          <View className="mt-4">
            <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>
              Exam History
            </Text>
            {filtered.map((entry, idx) => {
              const score = entry.score_percentage;
              const scoreColor =
                score >= 75
                  ? themeColors.success
                  : score >= 50
                  ? '#F59E0B'
                  : '#EF4444';
              return (
                <TouchableOpacity
                  key={`${entry.result_id ?? entry.attempt_id ?? idx}`}
                  className="flex-row items-center p-3 rounded-2xl mb-2 border"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  onPress={() => {
                    if (entry.result_id) {
                      router.push({
                        pathname: '/(auth)/practice-exam/results',
                        params: { resultId: entry.result_id, origin },
                      });
                    }
                  }}
                  disabled={!entry.result_id}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${scoreColor}18` }}
                  >
                    <Text className="text-sm font-bold" style={{ color: scoreColor }}>
                      {Math.round(score)}
                    </Text>
                    <Text className="text-[9px]" style={{ color: scoreColor }}>%</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {entry.label}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {entry.taken_at ? formatDate(entry.taken_at) : 'Unknown date'}
                    </Text>
                  </View>
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: scoreColor }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
