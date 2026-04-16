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

// ─────────────────────────────────────────────────────────────────────────────
// Services & UI components shared across student screens
// ─────────────────────────────────────────────────────────────────────────────
import {
  getStudentLeaderboard,
  type LeaderboardPeriod,
  type StudentLeaderboardEntry,
  type StudentLeaderboardResponse,
} from '../../../src/services/studentLeaderboardService';
import { shareLeaderboardAchievement } from '../../../src/services/shareService';
import {
  StudentFilterSheet,
  StudentHeroDecoration,
  StudentLeaderboardPodium,
  StudentLeaderboardRow,
  StudentSegmentedControl,
  formatWeeklyCountdown,
  studentColors,
  studentShadow,
} from '../../../src/student/ui';

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

  // ── State ────────────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [selectedProgramID, setSelectedProgramID] = useState<number | null>(null);
  const [selectedSubjectID, setSelectedSubjectID] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [response, setResponse] = useState<StudentLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    () => entries.filter((entry) => entry.rank > 3 && entry.userID !== viewer?.userID).slice(0, 7),
    [entries, viewer?.userID]
  );

  const viewerOutsideVisibleWeekly =
    Boolean(viewer?.rank) && viewer!.rank > 3 && !weeklyRows.some((entry) => entry.userID === viewer?.userID);

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
    <View style={styles.container}>
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

      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ─────────────────────────────────────────────────────────────────
            ORANGE HERO HEADER
            Displays the screen title and the Weekly / All Time toggle.
            ───────────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <StudentHeroDecoration />
          <Text style={styles.heroTitle}>Leaderboard</Text>
          <StudentSegmentedControl value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
        </View>

        {/* ─────────────────────────────────────────────────────────────────
            MAIN CONTENT SHEET
            White card with rounded top corners that slides over the orange
            hero. Contains loading, error, empty state, and the two views.
            ───────────────────────────────────────────────────────────────── */}
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            {loading ? (
              <View style={styles.feedbackCard}>
                <ActivityIndicator size="large" color={studentColors.orange} />
                <Text style={styles.feedbackText}>Loading leaderboard...</Text>
              </View>
            ) : error ? (
              <View style={styles.feedbackCard}>
                <Ionicons name="cloud-offline-outline" size={32} color={studentColors.orange} />
                <Text style={styles.feedbackText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={loadLeaderboard}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.feedbackCard}>
                <Ionicons name="trophy-outline" size={32} color={studentColors.orange} />
                <Text style={styles.feedbackTitle}>No rankings yet</Text>
                <Text style={styles.feedbackText}>
                  {selectedProgramID || selectedSubjectID
                    ? 'No entries match your selected filters.'
                    : 'Complete a practice exam to populate the leaderboard.'}
                </Text>
                {(selectedProgramID || selectedSubjectID) ? (
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => {
                      setSelectedProgramID(null);
                      setSelectedSubjectID(null);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Clear Filters</Text>
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
                <View style={styles.comparisonCard}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>{viewer?.rank != null ? `#${viewer.rank}` : '--'}</Text>
                  </View>
                  <Text style={styles.comparisonText}>{weeklyComparisonCopy}</Text>
                  {viewer?.rank != null && (
                    <Pressable
                      onPress={() =>
                        shareLeaderboardAchievement({
                          rank: viewer.rank,
                          score: viewer.score ?? 0,
                          subjectName: selectedSubject?.subjectName || selectedSubject?.subjectCode || null,
                        })
                      }
                      style={styles.shareIcon}
                      hitSlop={8}
                    >
                      <Ionicons name="share-outline" size={22} color={studentColors.orange} />
                    </Pressable>
                  )}
                </View>

                {/* Utility row: open filter sheet + weekly countdown chip */}
                <View style={styles.utilityRow}>
                  <Pressable style={styles.utilityButton} onPress={() => setFilterVisible(true)}>
                    <Text style={styles.utilityButtonText}>Filters</Text>
                    <Ionicons name="chevron-down" size={16} color={studentColors.orange} />
                  </Pressable>

                  <View style={styles.countdownChip}>
                    <Ionicons name="time-outline" size={14} color={studentColors.white} />
                    <Text style={styles.countdownText}>{formatWeeklyCountdown(viewer?.periodEndsAt ?? response?.meta.periodEndsAt)}</Text>
                  </View>
                </View>

                {/* Active filter pills: shows which Program / Subject is applied */}
                {selectedProgram || selectedSubject ? (
                  <View style={styles.filterSummaryRow}>
                    {selectedProgram ? (
                      <View style={styles.summaryPill}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.summaryPillText}>{selectedProgram.programName}</Text>
                      </View>
                    ) : null}
                    {selectedSubject ? (
                      <View style={styles.summaryPill}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.summaryPillText}>{selectedSubject.subjectCode || selectedSubject.subjectName}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Podium: displays ranks 1, 2, 3 with gold/silver/bronze bars */}
                {topThree.length >= 3 ? (
                  <View style={styles.podiumCard}>
                    <StudentLeaderboardPodium topThree={topThree} />
                  </View>
                ) : null}

                {/* Rows below podium: ranks 4-10 + viewer at bottom if outside */}
                <View style={styles.listWrap}>
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
                <View style={styles.comparisonCard}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>{viewer?.rank != null ? `#${viewer.rank}` : '--'}</Text>
                  </View>
                  <Text style={styles.comparisonText}>{allTimeComparisonCopy}</Text>
                  {viewer?.rank != null && (
                    <Pressable
                      onPress={() =>
                        shareLeaderboardAchievement({
                          rank: viewer.rank,
                          score: viewer.score ?? 0,
                          subjectName: selectedSubject?.subjectName || selectedSubject?.subjectCode || null,
                        })
                      }
                      style={styles.shareIcon}
                      hitSlop={8}
                    >
                      <Ionicons name="share-outline" size={22} color={studentColors.orange} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.allTimeHeader}>
                  <View>
                    <Text style={styles.allTimeTitle}>All-Time Rankings</Text>
                    <Text style={styles.allTimeSubtitle}>
                      {response?.meta.total ?? entries.length} students ranked across CAPS
                    </Text>
                  </View>

                  <Pressable style={styles.utilityButton} onPress={() => setFilterVisible(true)}>
                    <Text style={styles.utilityButtonText}>Filters</Text>
                    <Ionicons name="chevron-down" size={16} color={studentColors.orange} />
                  </Pressable>
                </View>

                {/* Active filter pills for all-time view */}
                {selectedProgram || selectedSubject ? (
                  <View style={styles.filterSummaryRow}>
                    {selectedProgram ? (
                      <View style={styles.summaryPill}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.summaryPillText}>{selectedProgram.programName}</Text>
                      </View>
                    ) : null}
                    {selectedSubject ? (
                      <View style={styles.summaryPill}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.summaryPillText}>{selectedSubject.subjectCode || selectedSubject.subjectName}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Ranked rows: top 10 with medals, plus viewer if outside */}
                <View style={styles.listWrap}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.white,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: studentColors.orange,
    gap: 18,
  },
  heroTitle: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 36,
    textAlign: 'center',
  },
  sheetWrap: {
    backgroundColor: studentColors.orange,
  },
  sheet: {
    backgroundColor: studentColors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -10,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    minHeight: 620,
  },
  comparisonCard: {
    borderRadius: 22,
    backgroundColor: '#FFD7C4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankPill: {
    minWidth: 46,
    height: 34,
    borderRadius: 17,
    backgroundColor: studentColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPillText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  comparisonText: {
    flex: 1,
    color: '#8A4A2F',
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  shareIcon: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: studentColors.white,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: studentColors.border,
    backgroundColor: studentColors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  utilityButtonText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: studentColors.orange,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countdownText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  filterSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    borderRadius: 999,
    backgroundColor: studentColors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 44,
    maxWidth: 160,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryPillText: {
    color: studentColors.orange,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '500',
  },
  podiumCard: {
    borderRadius: 30,
    backgroundColor: studentColors.orange,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 18,
    ...studentShadow,
  },
  listWrap: {
    gap: 12,
  },
  allTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  allTimeTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 30,
  },
  allTimeSubtitle: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    backgroundColor: studentColors.white,
    borderWidth: 2,
    borderColor: studentColors.border,
    paddingVertical: 30,
    paddingHorizontal: 20,
    ...studentShadow,
  },
  feedbackTitle: {
    color: studentColors.text,
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  feedbackText: {
    color: studentColors.textSoft,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: studentColors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: studentColors.white,
    fontFamily: 'Rubik',
    fontSize: 14,
    fontWeight: '700',
  },
});
