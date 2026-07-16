import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Pressable, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { getDashboardSummary, getLearningInsights } from '../../../src/features/student/insights/services/studentAnalyticsService';
import { StudentSectionHeader, studentColors, studentShadow } from '../../../src/features/student/ui/StudentUI';

function TopicCard({
  topic,
  index,
  rate,
}: {
  topic: string;
  index: number;
  rate: number;
}) {
  return (
    <View
      className="rounded-[22px] border-2 px-3 py-2.5 bg-white"
      style={{ borderColor: studentColors.border, ...studentShadow }}
    >
      <View className="flex-row items-center gap-3.5">
        <View
          className="w-14 h-14 rounded-[18px] items-center justify-center"
          style={{ backgroundColor: studentColors.surfaceSoft }}
        >
          <Ionicons
            name={index % 2 === 0 ? 'calculator-outline' : 'book-outline'}
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
            {Math.round(rate * 100)}% error rate
          </Text>
        </View>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: studentColors.surfaceSoft }}>
        <View className="h-full rounded-full" style={{ width: `${Math.round(rate * 100)}%`, backgroundColor: '#EF4444' }} />
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
        {message}
      </Text>
    </View>
  );
}

export default function WeakAreasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const refreshInFlightRef = useRef(false);
  const origin = (params.origin as string) || 'home';

  const [insights, setInsights] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadWeakAreas = useCallback(async ({ silent = false } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      setError('');
      const [insightResponse, summaryResponse] = await Promise.all([
        getLearningInsights(),
        getDashboardSummary(),
      ]);

      setInsights(insightResponse?.data || insightResponse || {});
      setSummary(summaryResponse?.data || summaryResponse || {});
      setError(insightResponse?.error || summaryResponse?.error || '');
    } catch (error) {
      console.error('Error loading weak areas:', error);
      setError('Unable to load weak areas right now.');
    } finally {
      refreshInFlightRef.current = false;
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWeakAreas();
  }, [loadWeakAreas]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeakAreas({ silent: true });
  };

  const weakTopics = useMemo(() => {
    if (Array.isArray(insights?.weak_topics) && insights.weak_topics.length > 0) {
      return insights.weak_topics;
    }
    if (summary?.weakest_topic?.name && summary.weakest_topic.name !== 'N/A') {
      return [{ topic: summary.weakest_topic.name, error_rate: summary.weakest_topic.error_rate ?? 0 }];
    }
    return [];
  }, [insights?.weak_topics, summary?.weakest_topic]);

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
              Weak Areas
            </Text>
            <Text className="text-sm text-white/80">
              Topics that need extra review based on your recent performance
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
              onPress={() => loadWeakAreas()}
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
            <StudentSectionHeader title="Weak Areas" />
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
              {weakTopics.length} topic{weakTopics.length !== 1 ? 's' : ''} identified for improvement
            </Text>
            <View className="gap-3">
              {weakTopics.length === 0 ? (
                <EmptyState message="No weak areas detected yet." />
              ) : (
                weakTopics.map((topic: any, index: number) => (
                  <TopicCard
                    key={`weak-${topic.topic}-${index}`}
                    topic={topic.topic}
                    index={index}
                    rate={topic.error_rate ?? 0}

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
