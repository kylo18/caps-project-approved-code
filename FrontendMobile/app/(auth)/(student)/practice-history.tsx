import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StatusBar } from 'react-native';
import CapsActivityIndicator from '../../../src/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { studentColors, studentShadow } from '../../../src/student/ui';
import {
  getPracticeExamHistory,
  getRank,
} from '../../../src/services/studentAnalyticsService';
import { useSelector } from 'react-redux';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreMeta(score: number) {
  if (score >= 75) return { color: studentColors.success, icon: 'checkmark-circle-outline', label: 'Passed' };
  if (score >= 50) return { color: '#F59E0B', icon: 'alert-circle-outline', label: 'Needs Work' };
  return { color: '#EF4444', icon: 'close-circle-outline', label: 'Failed' };
}

/* ── Components ──────────────────────────────────────────────────────────── */

function HistoryCard({
  entry,
  rank,
  onPress,
}: {
  entry: any;
  rank?: any;
  onPress?: () => void;
}) {
  const score = Number(entry.score ?? entry.score_percentage ?? entry.percentage ?? 0);
  const meta = scoreMeta(score);
  const subject = entry.subject_name ?? entry.subjectName ?? entry.label ?? 'Unknown Subject';
  const date = entry.created_at ?? entry.taken_at ?? entry.date;
  const attemptNum = entry.attempt_number ?? entry.attempt ?? null;

  return (
    <Pressable
      className="rounded-[20px] border-2 p-4 bg-white"
      style={{ borderColor: studentColors.border, ...studentShadow }}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            numberOfLines={1}
            style={{
              color: studentColors.text,
              fontFamily: 'Rubik',
              fontSize: 16,
              fontWeight: '600',
              lineHeight: 22,
            }}
          >
            {subject}
          </Text>
          {attemptNum ? (
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
              Attempt #{attemptNum}
            </Text>
          ) : null}
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
            {formatDate(date)}
          </Text>
        </View>

        <View className="items-end">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name={meta.icon as any} size={16} color={meta.color} />
            <Text
              style={{
                color: meta.color,
                fontFamily: 'Rubik',
                fontSize: 20,
                fontWeight: '700',
                lineHeight: 26,
              }}
            >
              {Math.round(score)}%
            </Text>
          </View>
          <Text
            style={{
              color: meta.color,
              fontFamily: 'Rubik',
              fontSize: 11,
              fontWeight: '600',
              lineHeight: 16,
              marginTop: 2,
            }}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      {(rank?.rank != null || rank?.total_students != null) && (
        <View
          className="flex-row items-center gap-2 mt-3 rounded-xl px-3 py-2"
          style={{ backgroundColor: studentColors.gold + '12' }}
        >
          <Ionicons name="trophy-outline" size={14} color={studentColors.gold} />
          <Text
            style={{
              color: studentColors.gold,
              fontFamily: 'Rubik',
              fontSize: 13,
              fontWeight: '600',
              lineHeight: 18,
            }}
          >
            Rank #{rank.rank}
            {rank.total_students ? ` of ${rank.total_students}` : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ── Screen ──────────────────────────────────────────────────────────────── */

export default function PracticeHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useSelector((state: any) => state.auth?.user);
  const refreshInFlightRef = useRef(false);
  const origin = (params.origin as string) || 'home';

  const [history, setHistory] = useState<any[]>([]);
  const [ranks, setRanks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const loadHistory = useCallback(async ({ silent = false } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      const res = await getPracticeExamHistory();
      const items = Array.isArray(res.data) ? res.data : [];
      setHistory(items);

      // Fetch ranks for each entry
      const userId = user?.userID;
      if (userId) {
        const rankPromises = items.map((entry: any) => {
          const resultId = entry.result_id ?? entry.resultID ?? entry.id;
          if (resultId) {
            return getRank(resultId, userId)
              .then((rankData) => ({ id: String(resultId), data: rankData }))
              .catch(() => null);
          }
          return Promise.resolve(null);
        });
        const results = await Promise.all(rankPromises);
        const rankMap: Record<string, any> = {};
        results.forEach((r: any) => {
          if (r?.data?.rank != null) rankMap[r.id] = r.data;
        });
        setRanks(rankMap);
      }
    } catch (error) {
      console.error('Error loading practice history:', error);
    } finally {
      refreshInFlightRef.current = false;
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userID]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory({ silent: true });
  };

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter((entry: any) => {
      const score = Number(entry.score ?? entry.score_percentage ?? entry.percentage ?? 0);
      return filter === 'passed' ? score >= 75 : score < 75;
    });
  }, [history, filter]);

  const passedCount = useMemo(
    () => history.filter((e: any) => Number(e.score ?? e.score_percentage ?? e.percentage ?? 0) >= 75).length,
    [history]
  );
  const failedCount = history.length - passedCount;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: studentColors.surface }}>
        <StatusBar barStyle="light-content" />
        <CapsActivityIndicator size="large" color={studentColors.orange} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        className="px-6 pb-5"
        style={{ paddingTop: insets.top + 12, backgroundColor: studentColors.orange }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
            onPress={() =>
              router.replace(origin === 'profile' ? '/(auth)/(student)/insights' : '/(auth)/(student)/dashboard')
            }
          >
            <Ionicons name="arrow-back" size={22} color={studentColors.white} />
          </Pressable>
          <Text
            style={{
              color: studentColors.white,
              fontFamily: 'Rubik',
              fontSize: 20,
              fontWeight: '600',
              lineHeight: 26,
            }}
          >
            Practice History
          </Text>
          <View className="w-10" />
        </View>

        {/* Summary chips */}
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl px-3 py-3 items-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <Text
              style={{
                color: studentColors.white,
                fontFamily: 'Rubik',
                fontSize: 22,
                fontWeight: '700',
                lineHeight: 28,
              }}
            >
              {history.length}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Rubik',
                fontSize: 12,
                fontWeight: '500',
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              Total Exams
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl px-3 py-3 items-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <Text
              style={{
                color: studentColors.white,
                fontFamily: 'Rubik',
                fontSize: 22,
                fontWeight: '700',
                lineHeight: 28,
              }}
            >
              {passedCount}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Rubik',
                fontSize: 12,
                fontWeight: '500',
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              Passed
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl px-3 py-3 items-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <Text
              style={{
                color: studentColors.white,
                fontFamily: 'Rubik',
                fontSize: 22,
                fontWeight: '700',
                lineHeight: 28,
              }}
            >
              {failedCount}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Rubik',
                fontSize: 12,
                fontWeight: '500',
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              Failed
            </Text>
          </View>
        </View>
      </View>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'all', label: 'All', count: history.length },
              { key: 'passed', label: 'Passed', count: passedCount },
              { key: 'failed', label: 'Failed', count: failedCount },
            ].map((f) => {
              const active = filter === (f.key as any);
              return (
                <Pressable
                  key={f.key}
                  className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2"
                  style={{
                    backgroundColor: active ? studentColors.orange : studentColors.surfaceSoft,
                  }}
                  onPress={() => setFilter(f.key as any)}
                >
                  <Text
                    style={{
                      color: active ? studentColors.white : studentColors.text,
                      fontFamily: 'Rubik',
                      fontSize: 13,
                      fontWeight: '600',
                      lineHeight: 18,
                    }}
                  >
                    {f.label}
                  </Text>
                  <View
                    className="rounded-full px-1.5 py-0.5 min-w-[20px] items-center"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : studentColors.border }}
                  >
                    <Text
                      style={{
                        color: active ? studentColors.white : studentColors.textSoft,
                        fontFamily: 'Rubik',
                        fontSize: 11,
                        fontWeight: '700',
                        lineHeight: 14,
                      }}
                    >
                      {f.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <ScrollView
        className="flex-1 px-5 pt-2"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColors.orange} />
        }
      >
        {filteredHistory.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Ionicons name="document-text-outline" size={40} color={studentColors.border} />
            <Text
              style={{
                color: studentColors.textSoft,
                fontFamily: 'Rubik',
                fontSize: 15,
                fontWeight: '500',
                lineHeight: 22,
              }}
            >
              {filter === 'all' ? 'No practice exams yet' : `No ${filter} exams`}
            </Text>
          </View>
        ) : (
          filteredHistory.map((entry: any, index: number) => {
            const resultId = entry.result_id ?? entry.resultID ?? entry.id;
            return (
              <HistoryCard
                key={`${resultId ?? index}-${index}`}
                entry={entry}
                rank={resultId ? ranks[String(resultId)] : undefined}
                onPress={() => {
                  if (resultId) {
                    router.push({
                      pathname: '/(auth)/practice-exam/results',
                      params: { resultId, origin },
                    });
                  }
                }}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
