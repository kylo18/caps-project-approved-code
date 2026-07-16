import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Services & UI components shared across student screens
// ─────────────────────────────────────────────────────────────────────────────
import {
  getStudentLeaderboard,
  type LeaderboardPeriod,
  type StudentLeaderboardEntry,
  type StudentLeaderboardResponse,
} from '../../../src/services/studentLeaderboardService';

import {
  StudentFilterSheet,
  StudentHeroDecoration,
  StudentLeaderboardPodium,
  StudentLeaderboardRow,
  StudentSegmentedControl,
  formatWeeklyCountdown,
  getStudentColors,
  getStudentShadow,
  LeaderboardShareModal,
} from '../../../src/features/student/ui/StudentUI';

// ─────────────────────────────────────────────────────────────────────────────
// Period selector options — toggles between Weekly reset leaderboard and
// cumulative All-Time rankings.
// ─────────────────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS: { label: string; value: LeaderboardPeriod }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'All Time', value: 'all_time' },
];

// Builds a subtitle like "BSIT • CS101" or falls back to "CAPS Student"
const buildEntrySubtitle = (entry: Partial<StudentLeaderboardEntry>) =>
  [entry.program, entry.subjectCode || entry.subject].filter(Boolean).join(' • ') || 'CAPS Student';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);

  // ── State ────────────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [selectedProgramID, setSelectedProgramID] = useState<number | null>(null);
  const [selectedSubjectID, setSelectedSubjectID] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [response, setResponse] = useState<StudentLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── State for Share Modal ────────────────────────────────────────────────
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareData, setShareData] = useState<{
    rank: number;
    score: number;
    subjectName?: string | null;
  } | null>(null);

  // ── Fetch leaderboard whenever period or filters change ──────────────────
  useEffect(() => {
    loadLeaderboard();
  }, [period, selectedProgramID, selectedSubjectID]);

  async function loadLeaderboard() {
    setLoading(true);
    setError('');

    try {
      const nextResponse = await getStudentLeaderboard({
        period,
        programID: selectedProgramID,
        subjectID: selectedSubjectID,
        limit: period === 'weekly' ? 12 : 20,
      });

      setResponse(nextResponse);
    } catch (loadError: any) {
      console.error('Failed to load leaderboard:', loadError);
      setError(loadError?.message || 'Unable to load leaderboard.');
    } finally {
      setLoading(false);
    }
  }

  const entries = response?.leaderboard ?? [];
  const viewer = response?.viewer ?? null;

  // Resolve full program/subject objects from the filter dropdown lists
  const selectedProgram = useMemo(
    () => response?.programs.find((program) => program.programID === selectedProgramID) ?? null,
    [response?.programs, selectedProgramID]
  );

  const selectedSubject = useMemo(
    () => response?.subjects.find((subject) => subject.subjectID === selectedSubjectID) ?? null,
    [response?.subjects, selectedSubjectID]
  );

  // ── Top 3 for the podium display ─────────────────────────────────────────
  const topThree = entries.slice(0, 3);

  // ── "Your Rank" card: merges viewer stats into the entries list ───────────
  const viewerEntry = useMemo(() => {
    if (!viewer || viewer.rank == null) {
      return null;
    }

    const existingEntry = entries.find((entry) => entry.userID === viewer.userID);
    if (existingEntry) {
      return existingEntry;
    }

    return {
      rank: viewer.rank,
      userID: viewer.userID,
      student_id: viewer.userID,
      name: viewer.name || 'You',
      program: viewer.program || null,
      subject: viewer.subject || null,
      subjectCode: null,
      score: viewer.score ?? 0,
      points: viewer.score ?? 0,
      highestScore: viewer.score ?? 0,
      highestPercentage: viewer.highestPercentage ?? 0,
      attempts: viewer.attempts ?? 0,
    } satisfies StudentLeaderboardEntry;
  }, [entries, viewer]);

  // Weekly view: skip the top 3 (shown in podium) and show ranks 4-10
  const weeklyRows = useMemo(
    () => entries.filter((entry) => entry.rank > 3).slice(0, 7),
    [entries]
  );

  const viewerOutsideVisibleWeekly =
    viewer?.rank != null && viewer.rank > 3 && !weeklyRows.some((entry) => entry.userID === viewer.userID);

  // All-time view: show top 10 ranked students
  const allTimeRows = useMemo(() => entries.slice(0, 10), [entries]);

  // Check if the viewer's rank falls outside the visible all-time top 10
  const viewerOutsideVisibleAllTime =
    Boolean(viewerEntry?.rank) && !allTimeRows.some((entry) => entry.userID === viewerEntry?.userID);

  // Motivational copy for the "Your Rank" card (Weekly)
  const weeklyComparisonCopy =
    viewer?.rank != null
      ? `You are doing better than ${viewer.betterThanPercentage}% of other students`
      : 'Take a practice exam this week to appear on the leaderboard.';

  // Motivational copy for All Time view
  const allTimeComparisonCopy =
    viewer?.rank != null
      ? `You are doing better than ${viewer.betterThanPercentage}% of other students`
      : 'Take a practice exam to appear on the all-time leaderboard.';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.page }}>
      <StatusBar style="light" />

      {/* ───────────────────────────────────────────────────────────────────
          FILTER SHEET
          Slide-up modal to filter leaderboard by Program or Subject.
          ─────────────────────────────────────────────────────────────────── */}
      <StudentFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        programs={response?.programs ?? []}
        subjects={response?.subjects ?? []}
        selectedProgramID={selectedProgramID}
        selectedSubjectID={selectedSubjectID}
        onSelectProgram={(value) => {
          setSelectedProgramID(value);
          setFilterVisible(false);
        }}
        onSelectSubject={(value) => {
          setSelectedSubjectID(value);
          setFilterVisible(false);
        }}
      />

      {/* ───────────────────────────────────────────────────────────────────
          SHARE PREVIEW MODAL
          Visual card generation & sharing.
          ─────────────────────────────────────────────────────────────────── */}
      {shareData && (
        <LeaderboardShareModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          rank={shareData.rank}
          score={shareData.score}
          studentName={viewer?.name || 'CAPS Student'}
          subjectName={shareData.subjectName}
          period={period}
        />
      )}

      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerClassName="pb-[120px]">

        {/* ─────────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Displays the screen title and the Weekly / All Time toggle.
            ───────────────────────────────────────────────────────────────── */}
        <View className="px-6 pb-[18px] gap-[18px]" style={{ backgroundColor: isDark ? colors.headerWarm : colors.header, paddingTop: insets.top + 16 }}>
          <StudentHeroDecoration />
          <Text className="text-white text-[28px] font-medium leading-[36px] text-center" style={{ fontFamily: 'Rubik' }}>Leaderboard</Text>
          <StudentSegmentedControl value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
        </View>

        {/* ─────────────────────────────────────────────────────────────────
            MAIN CONTENT SHEET
            White card with rounded top corners that slides over the orange
            hero. Contains loading, error, empty state, and the two views.
            ───────────────────────────────────────────────────────────────── */}
        <View style={{ backgroundColor: isDark ? colors.page : colors.header }}>
          <View className="px-6 pt-[22px] pb-7 min-h-[620px] rounded-t-[34px] -mt-2.5" style={{ backgroundColor: colors.card }}>
            {loading ? (
              <View className="items-center justify-center gap-2.5 rounded-3xl border-2 py-[30px] px-5" style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
                <CapsActivityIndicator size="large" color={colors.orange} />
                <Text className="text-sm font-normal leading-5 text-center" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>Loading leaderboard...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center gap-2.5 rounded-3xl border-2 py-[30px] px-5" style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
                <Ionicons name="cloud-offline-outline" size={32} color={colors.orange} />
                <Text className="text-sm font-normal leading-5 text-center" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>{error}</Text>
                <Pressable className="rounded-full px-4 py-2.5" style={{ backgroundColor: colors.orange }} onPress={loadLeaderboard}>
                  <Text className="text-sm font-bold text-white" style={{ fontFamily: 'Rubik' }}>Retry</Text>
                </Pressable>
              </View>
            ) : entries.length === 0 ? (
              <View className="items-center justify-center gap-2.5 rounded-3xl border-2 py-[30px] px-5" style={{ backgroundColor: colors.card, borderColor: colors.border, ...shadow }}>
                <Ionicons name="trophy-outline" size={32} color={colors.orange} />
                <Text className="text-lg font-medium leading-6" style={{ color: colors.text, fontFamily: 'Rubik' }}>No rankings yet</Text>
                <Text className="text-sm font-normal leading-5 text-center" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>
                  {selectedProgramID || selectedSubjectID
                    ? 'No entries match your selected filters.'
                    : 'Complete a practice exam to populate the leaderboard.'}
                </Text>
                {(selectedProgramID || selectedSubjectID) ? (
                  <Pressable
                    className="rounded-full px-4 py-2.5"
                    style={{ backgroundColor: colors.orange }}
                    onPress={() => {
                      setSelectedProgramID(null);
                      setSelectedSubjectID(null);
                    }}
                  >
                    <Text className="text-sm font-bold text-white" style={{ fontFamily: 'Rubik' }}>Clear Filters</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : period === 'weekly' ? (

              // ─────────────────────────────────────────────────────────────
              // WEEKLY VIEW
              // Resets every week. Shows:
              //   1. "Your Rank" card with current rank & motivational copy
              //   2. Filters button + weekly countdown timer
              //   3. Active filter pills (if any)
              //   4. Podium for ranks 1–3
              //   5. Rank 4–9 rows (+ viewer if outside top 10)
              // ─────────────────────────────────────────────────────────────
              <>
                {/* "Your Rank" card — displays viewer's current weekly rank */}
                <View className="rounded-[22px] px-4 py-3.5 flex-row items-center gap-3 mb-4" style={{ backgroundColor: colors.statsCard }}>
                  <View className="min-w-[46px] h-[34px] rounded-[17px] items-center justify-center" style={{ backgroundColor: colors.card }}>
                    <Text className="text-base font-bold leading-5" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{viewer?.rank != null ? `#${viewer.rank}` : '--'}</Text>
                  </View>
                  <Text className="flex-1 text-sm font-medium leading-5" style={{ color: isDark ? colors.text : '#8A4A2F', fontFamily: 'Rubik' }}>{weeklyComparisonCopy}</Text>
                  {viewer?.rank != null && (
                    <Pressable
                      onPress={() => {
                        setShareData({
                          rank: viewer.rank ?? 0,
                          score: viewer.score ?? 0,
                          subjectName: selectedSubject?.subjectName || selectedSubject?.subjectCode || undefined,
                        });
                        setShareModalVisible(true);
                      }}
                      className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
                      style={{ backgroundColor: colors.orange }}
                      hitSlop={8}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white" style={{ fontFamily: 'Rubik' }}>Share</Text>
                    </Pressable>
                  )}
                </View>

                {/* Utility row: open filter sheet + weekly countdown chip */}
                <View className="flex-row items-center justify-between gap-3 mb-3">
                  <Pressable className="flex-row items-center gap-1 rounded-full border px-3.5 py-2.5" style={{ backgroundColor: colors.card, borderColor: colors.border }} onPress={() => setFilterVisible(true)}>
                    <Text className="text-[13px] font-medium leading-[18px]" style={{ color: colors.orange, fontFamily: 'Rubik' }}>Filters</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.orange} />
                  </Pressable>

                  <View className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2.5" style={{ backgroundColor: colors.orange }}>
                    <Ionicons name="time-outline" size={14} color={colors.white} />
                    <Text className="text-xs font-medium leading-4 text-white" style={{ fontFamily: 'Rubik' }}>{formatWeeklyCountdown(viewer?.periodEndsAt ?? response?.meta.periodEndsAt)}</Text>
                  </View>
                </View>

                {/* Active filter pills: shows which Program / Subject is applied */}
                {selectedProgram || selectedSubject ? (
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {selectedProgram ? (
                      <View className="rounded-full px-3.5 py-3 h-11 max-w-[160px] shrink justify-center items-center" style={{ backgroundColor: colors.cardSoft }}>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="text-[13px] font-medium" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{selectedProgram.programName}</Text>
                      </View>
                    ) : null}
                    {selectedSubject ? (
                      <View className="rounded-full px-3.5 py-3 h-11 max-w-[160px] shrink justify-center items-center" style={{ backgroundColor: colors.cardSoft }}>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="text-[13px] font-medium" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{selectedSubject.subjectCode || selectedSubject.subjectName}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Podium: displays ranks 1, 2, 3 with gold/silver/bronze bars */}
                {topThree.length >= 3 ? (
                  <View className="rounded-[30px] px-[18px] pb-3.5 mb-[18px]" style={{ backgroundColor: isDark ? colors.statsCard : colors.orange, ...shadow }}>
                    <StudentLeaderboardPodium topThree={topThree} />
                  </View>
                ) : null}

                {/* Rows below podium: ranks 4-10 + viewer at bottom if outside */}
                <View className="gap-3">
                  {weeklyRows.map((entry) => (
                    <StudentLeaderboardRow
                      key={`${entry.userID}-${entry.rank}`}
                      entry={entry}
                      subtitle={buildEntrySubtitle(entry)}
                      emphasize={entry.userID === viewer?.userID}
                    />
                  ))}

                  {viewerOutsideVisibleWeekly && viewerEntry ? (
                    <StudentLeaderboardRow
                      entry={viewerEntry}
                      subtitle={buildEntrySubtitle(viewerEntry)}
                      emphasize
                    />
                  ) : null}
                </View>
              </>
            ) : (

              // ─────────────────────────────────────────────────────────────
              // ALL-TIME VIEW
              // Cumulative rankings across all time. Shows:
              //   1. "Your Rank" card with current rank
              //   2. Header with total count + Filters button
              //   3. Active filter pills (if any)
              //   4. Top 10 rows with medal icons for ranks 1–3
              //   5. Viewer row appended if outside the visible top 10
              // ─────────────────────────────────────────────────────────────
              <>
                {/* "Your Rank" card — displays viewer's current all-time rank */}
                <View className="rounded-[22px] px-4 py-3.5 flex-row items-center gap-3 mb-4" style={{ backgroundColor: colors.statsCard }}>
                  <View className="min-w-[46px] h-[34px] rounded-[17px] items-center justify-center" style={{ backgroundColor: colors.card }}>
                    <Text className="text-base font-bold leading-5" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{viewer?.rank != null ? `#${viewer.rank}` : '--'}</Text>
                  </View>
                  <Text className="flex-1 text-sm font-medium leading-5" style={{ color: isDark ? colors.text : '#8A4A2F', fontFamily: 'Rubik' }}>{allTimeComparisonCopy}</Text>
                  {viewer?.rank != null && (
                    <Pressable
                      onPress={() => {
                        setShareData({
                          rank: viewer.rank ?? 0,
                          score: viewer.score ?? 0,
                          subjectName: selectedSubject?.subjectName || selectedSubject?.subjectCode || undefined,
                        });
                        setShareModalVisible(true);
                      }}
                      className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
                      style={{ backgroundColor: colors.orange }}
                      hitSlop={8}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white" style={{ fontFamily: 'Rubik' }}>Share</Text>
                    </Pressable>
                  )}
                </View>

                <View className="flex-row items-center justify-between gap-3 mb-3">
                  <View>
                    <Text className="text-[22px] font-medium leading-[30px]" style={{ color: colors.text, fontFamily: 'Rubik' }}>All-Time Rankings</Text>
                    <Text className="text-[13px] font-normal leading-[18px] mt-0.5" style={{ color: colors.textSoft, fontFamily: 'Rubik' }}>
                      {response?.meta.total ?? entries.length} students ranked across CAPS
                    </Text>
                  </View>

                  <Pressable className="flex-row items-center gap-1 rounded-full border px-3.5 py-2.5" style={{ backgroundColor: colors.card, borderColor: colors.border }} onPress={() => setFilterVisible(true)}>
                    <Text className="text-[13px] font-medium leading-[18px]" style={{ color: colors.orange, fontFamily: 'Rubik' }}>Filters</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.orange} />
                  </Pressable>
                </View>

                {/* Active filter pills for all-time view */}
                {selectedProgram || selectedSubject ? (
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {selectedProgram ? (
                      <View className="rounded-full px-3.5 py-3 h-11 max-w-[160px] shrink justify-center items-center" style={{ backgroundColor: colors.cardSoft }}>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="text-[13px] font-medium" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{selectedProgram.programName}</Text>
                      </View>
                    ) : null}
                    {selectedSubject ? (
                      <View className="rounded-full px-3.5 py-3 h-11 max-w-[160px] shrink justify-center items-center" style={{ backgroundColor: colors.cardSoft }}>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="text-[13px] font-medium" style={{ color: colors.orange, fontFamily: 'Rubik' }}>{selectedSubject.subjectCode || selectedSubject.subjectName}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Ranked rows: top 10 with medals, plus viewer if outside */}
                <View className="gap-3">
                  {allTimeRows.map((entry) => (
                    <StudentLeaderboardRow
                      key={`${entry.userID}-${entry.rank}`}
                      entry={entry}
                      subtitle={buildEntrySubtitle(entry)}
                      showMedal={entry.rank <= 3}
                      emphasize={entry.userID === viewer?.userID}
                    />
                  ))}

                  {viewerOutsideVisibleAllTime && viewerEntry ? (
                    <StudentLeaderboardRow
                      entry={viewerEntry}
                      subtitle={buildEntrySubtitle(viewerEntry)}
                      emphasize
                    />
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
