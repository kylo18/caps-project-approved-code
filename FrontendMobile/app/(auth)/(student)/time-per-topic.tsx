import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Pressable, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { getLearningInsights } from '../../../src/features/student/insights/services/studentAnalyticsService';
import { StudentSectionHeader, studentColors, studentShadow } from '../../../src/features/student/ui/StudentUI';

function TimeEntryCard({
  entry,
  index,
  maxMinutes,
  totalMinutes,
}: {
  entry: any;
  index: number;
  maxMinutes: number;
  totalMinutes: number;
}) {
  const minutes = entry?.minutes ?? 0;
  const width = Math.min(100, Math.max(12, (minutes / Math.max(maxMinutes, 1)) * 100));
  const percentOfTotal = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;

  return (
    <View
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
            {minutes} minutes · {percentOfTotal}% of total time
          </Text>
        </View>
      </View>
      <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: studentColors.surfaceSoft }}>
        <View className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: studentColors.orange }} />
      </View>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
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
        {message}
      </Text>
    </View>
  );
}

export default function TimePerTopicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const refreshInFlightRef = useRef(false);
  const origin = (params.origin as string) || 'home';

  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTimePerTopic = useCallback(async ({ silent = false } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      setError('');
      const insightResponse = await getLearningInsights();
      setInsights(insightResponse?.data || insightResponse || {});
      setError(insightResponse?.error || '');
    } catch (error) {
      console.error('Error loading time per topic:', error);
      setError('Unable to load time per topic right now.');
    } finally {
      refreshInFlightRef.current = false;
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTimePerTopic();
  }, [loadTimePerTopic]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimePerTopic({ silent: true });
  };

  const timeSpent = Array.isArray(insights?.time_spent_per_topic) ? insights.time_spent_per_topic : [];
  const maxMinutes = useMemo(() => Math.max(...timeSpent.map((entry: any) => entry?.minutes ?? 0), 1), [timeSpent]);
  const totalMinutes = useMemo(() => timeSpent.reduce((sum: number, entry: any) => sum + (entry?.minutes ?? 0), 0), [timeSpent]);

  return (
    <View className="flex-1" style={{ backgroundColor: studentColors.orange }}>
      <StatusBar style="light" />

      <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center">
          <Pressable
            onPress={() =>
              router.replace(origin === 'profile' ? '/(auth)/(student)/insights' : '/(auth)/(student)/dashboard')
            }
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">
              Time per Topic
            </Text>
            <Text className="text-sm text-white/80">
              See where your study time is being spent
            </Text>
          </View>
        </View>
      </View>

      <View
        className="flex-1 rounded-t-[32px] bg-white px-5 pt-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <CapsActivityIndicator size="large" color={studentColors.orange} />
            <Text className="mt-4 text-base text-gray-400">Loading...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="mt-3 text-center text-base text-gray-600">{error}</Text>
            <Pressable
              onPress={() => loadTimePerTopic()}
              className="mt-4 rounded-full px-6 py-3"
              style={{ backgroundColor: studentColors.orange }}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColors.orange} />}
          >
            <StudentSectionHeader title="Time per Topic" />
            <Text
              className="mb-4 mt-[14px]"
              style={{
                color: studentColors.textSoft,
                fontFamily: 'Rubik',
                fontSize: 13,
                fontWeight: '400',
                lineHeight: 20,
              }}
            >
              {timeSpent.length} topic{timeSpent.length !== 1 ? 's' : ''} tracked
            </Text>
            <View className="gap-3">
              {timeSpent.length === 0 ? (
                <EmptyState message="No time data available yet." />
              ) : (
                timeSpent.map((entry: any, index: number) => (
                  <TimeEntryCard
                    key={`${entry.topic}-${index}`}
                    entry={entry}
                    index={index}
                    maxMinutes={maxMinutes}
                    totalMinutes={totalMinutes}

                  />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
